import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import { User } from "../../../types/auth";
import { TeacherLayout } from "../../../components/dashboard/layout/teacher-layout";
import { 
  ClipboardCheck, Search, Plus, Calendar, FileText, BarChart, XCircle, Upload
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
}
interface Stats { total: number; toGrade: number; completed: number; dueSoon: number; }

const createAssignmentSchema = z.object({
  type: z.enum(['devoir', 'controle_examen', 'evaluation'], { required_error: "Le type est requis." }),
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères.'),
  class_id: z.string().uuid('Veuillez sélectionner une classe.'),
  instructions: z.string().optional(),
  due_date: z.string().min(1, "La date d'échéance est requise."),
  max_points: z.coerce.number().min(0).optional(),
  attachment: z.instanceof(FileList).optional(),
});
type CreateAssignmentData = z.infer<typeof createAssignmentSchema>;
interface TeacherAssignmentsProps { user: User; }

export default function TeacherAssignments({ user }: TeacherAssignmentsProps) {
  // --- États ---
  const [activeTab, setActiveTab] = useState<'assignments' | 'exams' | 'evaluations'>("assignments");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allAssignments, setAllAssignments] = useState<AssignmentFromDB[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, toGrade: 0, completed: 0, dueSoon: 0 });
  const [teacherClasses, setTeacherClasses] = useState<ClassFromDB[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateAssignmentData>({ resolver: zodResolver(createAssignmentSchema) });

  // --- Chargement des données (Logique simplifiée et robuste) ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Étape 1 : On charge les données de base (devoirs et classes)
      const [assignmentsResult, classesResult] = await Promise.all([
        supabase.from('assignments').select(`id, title, due_date, type, class_id, classes(name)`).eq('teacher_id', user.id),
        supabase.from('classes').select('id, name').eq('teacher_id', user.id)
      ]);

      if (assignmentsResult.error || classesResult.error) {
        toast.error("Erreur de chargement des données de base.");
        setLoading(false);
        return;
      }
      
      const assignmentsData = assignmentsResult.data || [];
      const transformedAssignments = assignmentsData.map((a: any) => ({ ...a, classes: Array.isArray(a.classes) ? a.classes[0] : a.classes }));
      setAllAssignments(transformedAssignments);
      setTeacherClasses(classesResult.data || []);
      
      // Étape 2 : Si on a des devoirs, on calcule les stats en faisant une requête supplémentaire
      if (assignmentsData.length > 0) {
        const assignmentIds = assignmentsData.map(a => a.id);
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('submissions')
          .select('status')
          .in('assignment_id', assignmentIds);

        if (submissionsError) {
          toast.error("Erreur de chargement des statistiques de soumission.");
        } else {
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
          const dueSoonCount = assignmentsData.filter(a => a.due_date && new Date(a.due_date) <= sevenDaysFromNow && new Date(a.due_date) >= new Date()).length;
          const toGradeCount = (submissionsData || []).filter(s => s.status === 'submitted').length;
          const completedCount = (submissionsData || []).filter(s => s.status === 'graded').length;

          setStats({
            total: assignmentsData.length,
            toGrade: toGradeCount,
            completed: completedCount,
            dueSoon: dueSoonCount,
          });
        }
      } else {
        // S'il n'y a aucun devoir, les stats sont à zéro
        setStats({ total: 0, toGrade: 0, completed: 0, dueSoon: 0 });
      }

      setLoading(false);
    };
    fetchData();
  }, [showCreateModal, user.id]);

  // --- Fonction de création avec gestion de l'upload ---
  const onCreateAssignment = async (data: CreateAssignmentData) => {
    const toastId = toast.loading('Création en cours...');
    try {
      let attachmentUrl: string | null = null;
      const file = data.attachment?.[0];

      if (file) {
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('assignmentsattachments').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('assignmentsattachments').getPublicUrl(filePath);
        attachmentUrl = urlData?.publicUrl || null;
      }

      const { error: insertError } = await supabase.from('assignments').insert({
        title: data.title, type: data.type, class_id: data.class_id,
        instructions: data.instructions, due_date: data.due_date, max_points: data.max_points,
        attachment_url: attachmentUrl, teacher_id: user.id,
      });

      if (insertError) throw insertError;
      toast.success("Évaluation créée avec succès !", { id: toastId });
      setShowCreateModal(false);
      reset();

    } catch (error: any) {
      toast.error("Erreur: " + error.message, { id: toastId });
    }
  };

  const filteredAssignments = allAssignments.filter(a => {
    if (activeTab === 'assignments') return a.type === 'devoir';
    if (activeTab === 'exams') return a.type === 'controle_examen';
    if (activeTab === 'evaluations') return a.type === 'evaluation';
    return false;
  });

  return (
    <TeacherLayout user={user}>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Gestion des évaluations</h1><p className="mt-1 text-sm text-gray-500">Créez, assignez et gérez les évaluations de vos classes</p></div>
          <div className="flex gap-2"><button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4"/>Créer</button></div>
        </div>

        <div className="border-b border-gray-200"><nav className="-mb-px flex space-x-8">
            <button onClick={() => setActiveTab("assignments")} className={`px-1 py-4 text-sm font-medium ${activeTab === "assignments" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}><span className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4"/>Devoirs</span></button>
            <button onClick={() => setActiveTab("exams")} className={`px-1 py-4 text-sm font-medium ${activeTab === "exams" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}><span className="flex items-center gap-2"><FileText className="h-4 w-4"/>Contrôles & Examens</span></button>
            <button onClick={() => setActiveTab("evaluations")} className={`px-1 py-4 text-sm font-medium ${activeTab === "evaluations" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}><span className="flex items-center gap-2"><BarChart className="h-4 w-4"/>Évaluations</span></button>
        </nav></div>

        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-lg border bg-white p-6"><h3 className="text-sm font-medium text-gray-500">Total</h3><p className="mt-2 text-3xl font-semibold text-gray-900">{loading ? '...' : stats.total}</p><p className="mt-1 text-sm text-gray-500">Ce semestre</p></div>
          <div className="rounded-lg border bg-white p-6"><h3 className="text-sm font-medium text-gray-500">À corriger</h3><p className="mt-2 text-3xl font-semibold text-yellow-600">{loading ? '...' : stats.toGrade}</p><p className="mt-1 text-sm text-gray-500">En attente de notation</p></div>
          <div className="rounded-lg border bg-white p-6"><h3 className="text-sm font-medium text-gray-500">Complétés</h3><p className="mt-2 text-3xl font-semibold text-green-600">{loading ? '...' : stats.completed}</p><p className="mt-1 text-sm text-gray-500">Notés et rendus</p></div>
          <div className="rounded-lg border bg-white p-6"><h3 className="text-sm font-medium text-gray-500">À échéance proche</h3><p className="mt-2 text-3xl font-semibold text-red-600">{loading ? '...' : stats.dueSoon}</p><p className="mt-1 text-sm text-gray-500">Dans les 7 jours</p></div>
        </div>
        
        <div className="rounded-lg border bg-white overflow-hidden"><div className="divide-y">
          {loading ? (<p className="p-4 text-center">Chargement...</p>) : 
           filteredAssignments.length > 0 ? (
            filteredAssignments.map(assignment => <AssignmentItem key={assignment.id} assignment={assignment}/>)
           ) : (
            <p className="p-6 text-center text-gray-500">Aucun élément à afficher dans cette catégorie.</p>
           )
          }
        </div></div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Créer une nouvelle évaluation</h2><button aria-label="Fermer" onClick={() => setShowCreateModal(false)}><XCircle /></button></div>
              <form onSubmit={handleSubmit(onCreateAssignment)} className="space-y-4">
                <div><label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type</label><select id="type" {...register('type')} className="w-full rounded-lg border border-gray-300 py-2 px-3"><option value="devoir">Devoir</option><option value="controle_examen">Contrôle / Examen</option><option value="evaluation">Évaluation</option></select>{errors.type && <p className="text-red-600 text-sm mt-1">{errors.type.message}</p>}</div>
                <div><label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Titre</label><input id="title" {...register('title')} className="w-full rounded-lg border border-gray-300 py-2 px-3"/>{errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}</div>
                <div><label htmlFor="class_id" className="block text-sm font-medium text-gray-700 mb-1">Classe</label><select id="class_id" {...register('class_id')} className="w-full rounded-lg border border-gray-300 py-2 px-3"><option value="">-- Sélectionnez --</option>{teacherClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{errors.class_id && <p className="text-red-600 text-sm mt-1">{errors.class_id.message}</p>}</div>
                <div><label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">Instructions</label><textarea id="instructions" {...register('instructions')} className="w-full rounded-lg border border-gray-300 py-2 px-3 min-h-[100px]"/></div>
                <div><label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label><input id="due_date" type="datetime-local" {...register('due_date')} className="w-full rounded-lg border border-gray-300 py-2 px-3"/>{errors.due_date && <p className="text-red-600 text-sm mt-1">{errors.due_date.message}</p>}</div>
                <div><label htmlFor="max_points" className="block text-sm font-medium text-gray-700 mb-1">Points</label><input id="max_points" type="number" {...register('max_points')} className="w-full rounded-lg border border-gray-300 py-2 px-3"/></div>
                <div><label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-1">Pièce jointe</label><div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"><div className="space-y-1 text-center"><Upload className="mx-auto h-12 w-12 text-gray-400" /><div className="flex text-sm text-gray-600"><label htmlFor="attachment" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"><span>Télécharger un fichier</span><input id="attachment" type="file" className="sr-only" {...register("attachment")} /></label><p className="pl-1">ou glissez-déposez</p></div><p className="text-xs text-gray-500">PDF, DOCX, PNG, JPG</p></div></div></div>
                <div className="flex justify-end gap-3 pt-4 border-t mt-6"><button type="button" onClick={() => setShowCreateModal(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm">Annuler</button><button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">Créer</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}

const AssignmentItem = ({ assignment }: { assignment: AssignmentFromDB }) => {
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
    <div className="p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${getIconBgColor()}`}>{getIcon()}</div>
        <div>
          <h3 className="font-medium text-gray-900">{assignment.title}</h3>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span>{assignment.classes?.name || 'Classe non assignée'}</span>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4"/>Dû le {new Date(assignment.due_date).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-2 sm:mt-0"><button className="rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-100">Corriger</button><button className="rounded-md bg-gray-50 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100">Détails</button></div>
    </div></div>
  );
};