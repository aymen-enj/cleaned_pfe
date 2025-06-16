import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import { User } from "../../../types/auth";
import { StudentLayout } from "../../../components/dashboard/layout/student-layout";
import { ClipboardCheck, Search, Calendar, XCircle, Download, FileText, CheckCircle } from "lucide-react";

// --- Types ---
interface StudentAssignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  instructions?: string | null;
  attachment_path?: string | null;
  // Ajout des nouveaux champs
  type: 'devoir' | 'controle_examen' | 'evaluation';
  max_points?: number | null;
  // Champ pour le fichier de correction
  correction_file_url?: string | null; 
}
interface StudentAssignmentsProps { user: User; }

export default function StudentAssignments({ user }: StudentAssignmentsProps) {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  // MODIFIÉ: On crée deux états pour nos deux listes
  const [activeAssignments, setActiveAssignments] = useState<StudentAssignment[]>([]);
  const [correctedAssignments, setCorrectedAssignments] = useState<StudentAssignment[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);

  useEffect(() => {
    const fetchStudentAssignments = async () => {
      setLoading(true);

      try {
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('class_enrollments').select('class_id').eq('student_id', user.id);

        if (enrollmentsError) throw enrollmentsError;
        if (enrollmentsError || !enrollments || enrollments.length === 0) {
          setActiveAssignments([]);   // <-- CORRECTION
          setCorrectedAssignments([]); // <-- CORRECTION
          setLoading(false);
          return;
        }
        const classIds = enrollments.map(e => e.class_id);

        // MODIFIÉ: On demande le nouveau champ 'correction_file_url'
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select(`id, title, type, due_date, instructions, attachment_path, max_points, correction_file_url, classes(name)`)
          .in('class_id', classIds);

        if (assignmentsError) throw assignmentsError;
        
        const assignmentIds = (assignmentsData || []).map(a => a.id);
        const { data: submissions, error: submissionsError } = await supabase
          .from('submissions').select('assignment_id, status').eq('student_id', user.id).in('assignment_id', assignmentIds);

        if (submissionsError) throw submissionsError;
        
        const allAssignments = (assignmentsData || []).map((a: any) => {
          const submission = (submissions || []).find(s => s.assignment_id === a.id);
          return {
            id: a.id,
            title: a.title,
            course: a.classes?.name || 'N/A',
            dueDate: a.due_date,
            instructions: a.instructions,
            attachment_path: a.attachment_path,
            type: a.type,
            max_points: a.max_points,
            correction_file_url: a.correction_file_url,
            status: submission?.status || 'pending',
          };
        });

        // NOUVEAU: On trie les devoirs dans les deux listes
        const active = allAssignments.filter(a => a.status !== 'graded');
        const corrected = allAssignments.filter(a => a.status === 'graded');
        setActiveAssignments(active);
        setCorrectedAssignments(corrected);

      } catch (error: any) {
        console.error("Erreur détaillée lors du chargement :", error);
        toast.error("Impossible de charger les devoirs: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchStudentAssignments();
    }
  }, [user.id]);

  const handleViewDetails = (assignment: StudentAssignment) => {
    setSelectedAssignment(assignment);
    setShowDetailsModal(true);
  };

  return (
    <StudentLayout user={user}>
      <div className="p-6 space-y-8"> {/* Augmentation de l'espacement */}
        <div><h1 className="text-2xl font-bold text-gray-900">My Assignments</h1><p className="mt-1 text-sm text-gray-500">View and manage your assignments</p></div>
        
        {/* Filter & list */}
        {/* Filtrer par classe */}
        <div className="flex items-center gap-3">
          <label htmlFor="classFilter" className="text-sm text-gray-700">Filter by class:</label>
          <select id="classFilter" value={selectedClass} onChange={e=>setSelectedClass(e.target.value)} className="border border-gray-300 rounded-md py-1 px-2 text-sm">
            <option value="all">All</option>
            {Array.from(new Set(activeAssignments.map(a=>a.course))).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-4">
          <div className="rounded-lg border bg-white mt-2">
            <div className="divide-y">
              {loading ? <p className="p-6 text-center text-gray-500">Loading...</p> :
               activeAssignments.length === 0 ? <p className="p-6 text-center text-gray-500">No assignments pending. Great job!</p> :
               (selectedClass === 'all' ? activeAssignments : activeAssignments.filter(a => a.course === selectedClass)).map((assignment) => (
                  <AssignmentRow key={assignment.id} assignment={assignment} onViewDetails={() => handleViewDetails(assignment)} />
               ))
              }
            </div>
          </div>
        </div>

                {/* Modal de Détails (mis à jour pour inclure la correction) */}
        {showDetailsModal && selectedAssignment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">{selectedAssignment.type?.replace('_', ' ') || 'ASSIGNMENT'}</span>
                  <h2 className="text-xl font-bold mt-2">{selectedAssignment.title}</h2>
                  <p className="text-sm text-gray-500">{selectedAssignment.course}</p>
                </div>
                <button aria-label="Close" onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-800"><XCircle /></button>
              </div>
              <div className="space-y-6 border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg"><p className="font-medium text-gray-600">Max Points</p><p className="text-gray-900 font-semibold">{selectedAssignment.max_points ?? 'Non spécifié'}</p></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><p className="font-medium text-gray-600">Due Date</p><p className="text-gray-900 font-semibold">{new Date(selectedAssignment.dueDate).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</p></div>
                </div>
                <div><h3 className="font-medium text-gray-800">Instructions</h3><p className="mt-1 text-gray-600 whitespace-pre-wrap">{selectedAssignment.instructions || "No instructions provided."}</p></div>
                {selectedAssignment.attachment_path && (
                  <div><h3 className="font-medium text-gray-800">Teacher Attachment</h3><a href={supabase.storage.from('assignmentsattachments').getPublicUrl(selectedAssignment.attachment_path).data.publicUrl} target="_blank" rel="noopener noreferrer" download className="mt-1 inline-flex items-center gap-2 text-blue-600 hover:underline"><Download className="h-4 w-4" />Download attachment</a></div>
                )}
                {/* NOUVELLE section pour afficher le fichier de correction */}
                {selectedAssignment.correction_file_url && (
                  <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
                    <h3 className="font-medium text-green-800">Teacher Correction</h3>
                    <a href={selectedAssignment.correction_file_url} target="_blank" rel="noopener noreferrer" download className="mt-1 inline-flex items-center gap-2 text-green-700 hover:underline">
                      <FileText className="h-4 w-4" />
                      Download correction
                    </a>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t flex justify-end"><button onClick={() => setShowDetailsModal(false)} className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200">Close</button></div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

// Sous-composant pour afficher une ligne de devoir
const AssignmentRow = ({ assignment, onViewDetails }: { assignment: StudentAssignment; onViewDetails: () => void; }) => {
  const getStatusButton = () => {
    switch (assignment.status) {
      case 'graded': return <button className="rounded-md bg-green-100 px-3 py-1 text-sm font-medium text-green-700 hover:bg-green-200 flex items-center gap-1"><CheckCircle className="h-4 w-4"/> View Grade</button>;
      case 'submitted': return <button className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200">View Submission</button>;
      case 'pending': default: return <button className="rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200">View</button>;
    }
  };

  return (
    <div onClick={onViewDetails} className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-grow">
          <div className={`rounded-lg p-2 ${assignment.status === 'graded' ? 'bg-green-100' : assignment.status === 'submitted' ? 'bg-blue-100' : 'bg-yellow-100'}`}>
            <ClipboardCheck className={`h-5 w-5 ${assignment.status === 'graded' ? 'text-green-600' : assignment.status === 'submitted' ? 'text-blue-600' : 'text-yellow-600'}`} />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{assignment.title}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{assignment.course}</span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Due {new Date(assignment.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          {getStatusButton()}
          {assignment.correction_file_url ? (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Corrected</span>
          ) : (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Not corrected</span>
          )}
        </div>
      </div>
    </div>
  );
};