import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import { User } from "../../../types/auth";
import { TeacherLayout } from "../../../components/dashboard/layout/teacher-layout";
import {
  ClipboardCheck, Search, Plus, Calendar, FileText, BarChart, XCircle, Upload, FileCheck, CheckCircle
} from "lucide-react";

// --- Types ---
interface ClassFromDB { id: string; name: string; }
interface AssignmentFromDB {
  id: string; 
  title: string; 
  due_date: string;
  type: 'devoir' | 'controle_examen' | 'evaluation';
  class_id: string; 
  classes: { name: string } | null;
  status: string;
}

interface Stats { 
  total: number; 
  toGrade: number; 
  completed: number; 
  dueSoon: number; 
}

const createAssignmentSchema = z.object({
  type: z.enum(['devoir', 'controle_examen', 'evaluation']),
  title: z.string().min(3, 'Le titre est requis.'),
  class_id: z.string().uuid('Veuillez sélectionner une classe.'),
  instructions: z.string().optional(),
  due_date: z.string().min(1, "La date d'échéance est requise."),
  max_points: z.coerce.number().min(0).optional(),
  attachment: z.instanceof(FileList).optional(),
});

type CreateAssignmentData = z.infer<typeof createAssignmentSchema>;

const correctionSchema = z.object({
  correctionFile: z.instanceof(FileList).refine(files => files?.length > 0, 'Veuillez sélectionner un fichier.'),
});

type CorrectionData = z.infer<typeof correctionSchema>;

interface TeacherAssignmentsProps { user: User; }

export default function TeacherAssignments({ user }: TeacherAssignmentsProps) {
  // --- États ---
  const [activeTab, setActiveTab] = useState<'assignments' | 'exams' | 'evaluations'>("assignments");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allAssignments, setAllAssignments] = useState<AssignmentFromDB[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, toGrade: 0, completed: 0, dueSoon: 0 });
  const [teacherClasses, setTeacherClasses] = useState<ClassFromDB[]>([]);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentFromDB | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Formulaires
  const createForm = useForm<CreateAssignmentData>({ resolver: zodResolver(createAssignmentSchema) });
  const correctionForm = useForm<CorrectionData>({ resolver: zodResolver(correctionSchema) });

  const attachmentFile = createForm.watch("attachment");
  const selectedFileName = attachmentFile && attachmentFile.length > 0 ? attachmentFile[0].name : null;
  const correctionAttachmentFile = correctionForm.watch("correctionFile");
  const selectedCorrectionFileName = correctionAttachmentFile && correctionAttachmentFile.length > 0 ? correctionAttachmentFile[0].name : null;

  // --- Chargement des données ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('id, title, due_date, type, class_id, status, classes(name)')
        .eq('teacher_id', user.id);

      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', user.id);

      if (assignmentsError || classesError) {
        toast.error("Erreur de chargement.");
      } else {
        const transformedAssignments = (assignmentsData || []).map((a: any) => ({
          ...a,
          classes: Array.isArray(a.classes) ? a.classes[0] : a.classes
        }));

        // Calculate real statistics
        const total = transformedAssignments.length;
        const toGrade = transformedAssignments.filter(a => !a.status || a.status !== 'corrected').length;
        const completed = transformedAssignments.filter(a => a.status === 'corrected').length;
        const dueSoon = transformedAssignments.filter(a => {
          const dueDate = new Date(a.due_date);
          const now = new Date();
          const threeDaysFromNow = new Date();
          threeDaysFromNow.setDate(now.getDate() + 3);
          return dueDate <= threeDaysFromNow && dueDate >= now;
        }).length;

        setAllAssignments(transformedAssignments);
        setTeacherClasses(classesData || []);
        setStats({
          total,
          toGrade,
          completed,
          dueSoon
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [showCreateModal, showCorrectionModal, user.id]);

  // --- Fonctions de soumission ---
  const onCreateAssignment = async (data: CreateAssignmentData) => {
    const toastId = toast.loading('Création en cours...');
    try {
      let attachmentUrl: string | null = null;
      const file = data.attachment?.[0];
      
      if (file) {
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('assignmentsattachments')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('assignmentsattachments')
          .getPublicUrl(filePath);
        
        attachmentUrl = urlData?.publicUrl || null;
      }

      const { error: insertError } = await supabase
        .from('assignments')
        .insert({ 
          title: data.title, 
          type: data.type, 
          class_id: data.class_id, 
          instructions: data.instructions, 
          due_date: data.due_date, 
          max_points: data.max_points, 
          attachment_url: attachmentUrl, 
          teacher_id: user.id 
        });

      if (insertError) throw insertError;
      
      toast.success("Évaluation créée !", { id: toastId });
      setShowCreateModal(false);
      createForm.reset();
    } catch (error: any) {
      toast.error("Erreur: " + error.message, { id: toastId });
    }
  };

  const handleOpenCorrectionModal = (assignment: AssignmentFromDB) => {
    setSelectedAssignment(assignment);
    setShowCorrectionModal(true);
  };

  const onCorrectAssignment = async (data: CorrectionData) => {
    if (!selectedAssignment) return;
    
    const toastId = toast.loading('Enregistrement...');
    try {
      const file = data.correctionFile[0];
      const filePath = `${user.id}/corrections/${selectedAssignment.id}/${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assignmentsattachments')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('assignmentsattachments')
        .getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('assignments')
        .update({ 
          correction_file_url: urlData?.publicUrl, 
          status: 'corrected' 
        })
        .eq('id', selectedAssignment.id);
      
      if (updateError) throw updateError;
      
      toast.success("Correction enregistrée !", { id: toastId });
      setShowCorrectionModal(false);
      correctionForm.reset();
    } catch (error: any) {
      toast.error("Erreur: " + error.message, { id: toastId });
    }
  };

  // Filtrage des assignments
  const filteredAssignments = allAssignments.filter(a => {
    if (selectedClass !== 'all' && a.class_id !== selectedClass) {
      return false;
    }
    
    if (activeTab === 'assignments') return a.type === 'devoir';
    if (activeTab === 'exams') return a.type === 'controle_examen';
    if (activeTab === 'evaluations') return a.type === 'evaluation';
    return false;
  });

  const ClassFilter = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="rounded-lg p-2 bg-blue-50 text-blue-600">
          <Search className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Filtrer par classe</h3>
          <p className="text-sm text-gray-500">Afficher les évaluations d'une classe spécifique</p>
        </div>
      </div>
      <label htmlFor="class-filter-select" className="sr-only">Filtrer par classe</label>
      <select
        id="class-filter-select"
        aria-label="Filtrer par classe"
        value={selectedClass}
        onChange={(e) => setSelectedClass(e.target.value)}
        className="block w-full sm:w-64 rounded-md border-gray-300 shadow-sm
        focus:border-blue-500 focus:ring-blue-500
        bg-white py-2 pl-3 pr-10 text-sm"
      >
        <option value="all">Toutes les classes</option>
        {teacherClasses.map((classe) => (
          <option key={classe.id} value={classe.id}>
            {classe.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <TeacherLayout user={user}>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des évaluations</h1>
            <p className="mt-1 text-sm text-gray-500">Créez, assignez et gérez les évaluations de vos classes</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4"/>Créer
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button 
              onClick={() => setActiveTab("assignments")} 
              className={`px-1 py-4 text-sm font-medium ${activeTab === "assignments" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <span className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4"/>Devoirs
              </span>
            </button>
            <button 
              onClick={() => setActiveTab("exams")} 
              className={`px-1 py-4 text-sm font-medium ${activeTab === "exams" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4"/>Contrôles & Examens
              </span>
            </button>
            <button 
              onClick={() => setActiveTab("evaluations")} 
              className={`px-1 py-4 text-sm font-medium ${activeTab === "evaluations" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <span className="flex items-center gap-2">
                <BarChart className="h-4 w-4"/>Évaluations
              </span>
            </button>
          </nav>
        </div>

        <ClassFilter />

        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500">Total</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{loading ? '...' : stats.total}</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500">À corriger</h3>
            <p className="mt-2 text-3xl font-semibold text-yellow-600">{loading ? '...' : stats.toGrade}</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500">Complétés</h3>
            <p className="mt-2 text-3xl font-semibold text-green-600">{loading ? '...' : stats.completed}</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500">À échéance proche</h3>
            <p className="mt-2 text-3xl font-semibold text-red-600">{loading ? '...' : stats.dueSoon}</p>
          </div>
        </div>
        
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="divide-y">
            {loading ? (
              <p className="p-4 text-center">Chargement...</p>
            ) : filteredAssignments.length > 0 ? (
              filteredAssignments.map(assignment => (
                <AssignmentItem 
                  key={assignment.id} 
                  assignment={assignment} 
                  onGradeClick={() => handleOpenCorrectionModal(assignment)} 
                />
              ))
            ) : (
              <p className="p-6 text-center text-gray-500">Aucun élément à afficher dans cette catégorie.</p>
            )}
          </div>
        </div>

        {/* Modal de création */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Créer une nouvelle évaluation</h2>
                <button aria-label="Fermer" onClick={() => setShowCreateModal(false)}>
                  <XCircle />
                </button>
              </div>
              
              <form onSubmit={createForm.handleSubmit(onCreateAssignment)} className="space-y-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select 
                    id="type" 
                    {...createForm.register('type')} 
                    className="w-full rounded-lg border border-gray-300 py-2 px-3"
                  >
                    <option value="devoir">Devoir</option>
                    <option value="controle_examen">Contrôle / Examen</option>
                    <option value="evaluation">Évaluation</option>
                  </select>
                  {createForm.formState.errors.type && (
                    <p className="text-red-600 text-sm mt-1">{createForm.formState.errors.type.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                  <input 
                    id="title" 
                    {...createForm.register('title')} 
                    className="w-full rounded-lg border border-gray-300 py-2 px-3"
                  />
                  {createForm.formState.errors.title && (
                    <p className="text-red-600 text-sm mt-1">{createForm.formState.errors.title.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="class_id" className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                  <select 
                    id="class_id" 
                    {...createForm.register('class_id')} 
                    className="w-full rounded-lg border border-gray-300 py-2 px-3"
                  >
                    <option value="">-- Sélectionnez --</option>
                    {teacherClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {createForm.formState.errors.class_id && (
                    <p className="text-red-600 text-sm mt-1">{createForm.formState.errors.class_id.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                  <textarea 
                    id="instructions" 
                    {...createForm.register('instructions')} 
                    className="w-full rounded-lg border border-gray-300 py-2 px-3 min-h-[100px]"
                  />
                </div>
                
                <div>
                  <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                  <input 
                    id="due_date" 
                    type="datetime-local" 
                    {...createForm.register('due_date')} 
                    className="w-full rounded-lg border border-gray-300 py-2 px-3"
                  />
                  {createForm.formState.errors.due_date && (
                    <p className="text-red-600 text-sm mt-1">{createForm.formState.errors.due_date.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="max_points" className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                  <input 
                    id="max_points" 
                    type="number" 
                    {...createForm.register('max_points')} 
                    className="w-full rounded-lg border border-gray-300 py-2 px-3"
                  />
                </div>
                
                <div>
                  <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-1">Pièce jointe</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {selectedFileName ? (
                        <>
                          <FileCheck className="mx-auto h-12 w-12 text-green-500" />
                          <p className="mt-2 text-sm text-gray-900 font-medium truncate">{selectedFileName}</p>
                          <label htmlFor="attachment" className="mt-2 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500">
                            Changer
                          </label>
                          <input 
                            id="attachment" 
                            type="file" 
                            className="sr-only" 
                            {...createForm.register("attachment")} 
                          />
                        </>
                      ) : (
                        <>
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label htmlFor="attachment" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                              <span>Télécharger</span>
                              <input 
                                id="attachment" 
                                type="file" 
                                className="sr-only" 
                                {...createForm.register("attachment")} 
                              />
                            </label>
                            <p className="pl-1">ou glissez-déposez</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)} 
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
                  >
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de correction */}
        {showCorrectionModal && selectedAssignment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Ajouter une Correction</h2>
                <button aria-label="Fermer" onClick={() => setShowCorrectionModal(false)}>
                  <XCircle />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Pour : <span className="font-medium">{selectedAssignment.title}</span>
              </p>
              
              <form onSubmit={correctionForm.handleSubmit(onCorrectAssignment)} className="space-y-4">
                <div>
                  <label htmlFor="correctionFile" className="block text-sm font-medium text-gray-700 mb-1">
                    Fichier de correction
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    {selectedCorrectionFileName ? (
                      <div className="text-center">
                        <FileCheck className="mx-auto h-12 w-12 text-green-500" />
                        <p className="mt-2 text-sm text-gray-900 font-medium truncate">
                          {selectedCorrectionFileName}
                        </p>
                        <label 
                          htmlFor="correctionFile" 
                          className="mt-2 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                          Changer
                        </label>
                        <input 
                          id="correctionFile" 
                          type="file" 
                          className="sr-only" 
                          {...correctionForm.register("correctionFile")} 
                        />
                      </div>
                    ) : (
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <label 
                          htmlFor="correctionFile" 
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                        >
                          <span>Télécharger</span>
                          <input 
                            id="correctionFile" 
                            type="file" 
                            className="sr-only" 
                            {...correctionForm.register("correctionFile")} 
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  {correctionForm.formState.errors.correctionFile && (
                    <p className="text-red-600 text-sm mt-1">
                      {correctionForm.formState.errors.correctionFile.message}
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                  <button 
                    type="button" 
                    onClick={() => setShowCorrectionModal(false)} 
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}

const AssignmentItem = ({ 
  assignment, 
  onGradeClick 
}: { 
  assignment: AssignmentFromDB; 
  onGradeClick: () => void; 
}) => {
  const getIcon = () => {
    const iconProps = { className: "h-5 w-5" };
    switch (assignment.type) {
      case 'devoir': return <ClipboardCheck {...iconProps} />;
      case 'controle_examen': return <FileText {...iconProps} />;
      case 'evaluation': return <BarChart {...iconProps} />;
      default: return <ClipboardCheck {...iconProps} />;
    }
  };

  const getIconBgColor = () => {
    switch (assignment.type) {
      case 'devoir': return 'bg-yellow-100 text-yellow-600';
      case 'controle_examen': return 'bg-blue-100 text-blue-600';
      case 'evaluation': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${getIconBgColor()}`}>
            {getIcon()}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{assignment.title}</h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span>{assignment.classes?.name || 'Classe non assignée'}</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4"/>
                Dû le {new Date(assignment.due_date).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-2 sm:mt-0">
          {assignment.status === 'corrected' ? (
            <span className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
              <CheckCircle className="h-4 w-4" />
              Corrigé
            </span>
          ) : (
            <button 
              onClick={onGradeClick} 
              className="rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-100"
            >
              Corriger
            </button>
          )}
          <button className="rounded-md bg-gray-50 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100">
            Détails
          </button>
        </div>
      </div>
    </div>
  );
};