import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import { User } from "../../../types/auth";
import { StudentLayout } from "../../../components/dashboard/layout/student-layout";
import { ClipboardCheck, Search, Calendar, XCircle, Download } from "lucide-react";

// --- Types ---
interface StudentAssignment {
  id: string; title: string; course: string; dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  instructions?: string | null; attachment_url?: string | null;
}
interface StudentAssignmentsProps { user: User; }

export default function StudentAssignments({ user }: StudentAssignmentsProps) {
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);

  useEffect(() => {
    const fetchStudentAssignments = async () => {
      setLoading(true);

      try {
        // ÉTAPE 1: TROUVER LES CLASSES DE L'ÉTUDIANT
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('class_enrollments')
          .select('class_id')
          .eq('student_id', user.id);

        if (enrollmentsError) throw enrollmentsError;
        if (!enrollments || enrollments.length === 0) {
          setAssignments([]); setLoading(false); return;
        }
        const classIds = enrollments.map(e => e.class_id);

        // ÉTAPE 2: TROUVER TOUS LES DEVOIRS DE CES CLASSES
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select(`id, title, due_date, instructions, attachment_url, classes ( name )`)
          .in('class_id', classIds);

        if (assignmentsError) throw assignmentsError;
        
        // ÉTAPE 3: TROUVER LES SOUMISSIONS DE L'ÉTUDIANT POUR CES DEVOIRS
        const assignmentIds = (assignmentsData || []).map(a => a.id);
        const { data: submissions, error: submissionsError } = await supabase
          .from('submissions')
          .select('assignment_id, status')
          .eq('student_id', user.id)
          .in('assignment_id', assignmentIds);

        if (submissionsError) throw submissionsError;
        
        // ÉTAPE 4: COMBINER TOUTES LES INFORMATIONS
        const finalAssignments = (assignmentsData || []).map((a: any) => {
          const submission = (submissions || []).find(s => s.assignment_id === a.id);
          return {
            id: a.id,
            title: a.title,
            course: a.classes?.name || 'N/A',
            dueDate: a.due_date,
            instructions: a.instructions,
            attachment_url: a.attachment_url,
            status: submission?.status || 'pending',
          };
        });

        setAssignments(finalAssignments);

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
      <div className="p-6 space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-900">My Assignments</h1><p className="mt-1 text-sm text-gray-500">View and manage your assignments</p></div>
        <div className="relative mt-4"><Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search assignments..." className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4"/></div>
        
        <div className="rounded-lg border bg-white mt-6">
          <div className="divide-y">
            {loading ? <p className="p-6 text-center text-gray-500">Loading...</p> :
             assignments.length === 0 ? <p className="p-6 text-center text-gray-500">You have no assignments.</p> :
             assignments.map((assignment) => (
                <AssignmentRow key={assignment.id} assignment={assignment} onViewDetails={() => handleViewDetails(assignment)} />
             ))
            }
          </div>
        </div>

        {showDetailsModal && selectedAssignment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div><h2 className="text-xl font-bold">{selectedAssignment.title}</h2><p className="text-sm text-gray-500">{selectedAssignment.course}</p></div>
                <button aria-label="Fermer" onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-800"><XCircle /></button>
              </div>
              <div className="space-y-6 border-t pt-4">
                <div>
                  <h3 className="font-medium text-gray-800">Instructions</h3>
                  <p className="mt-1 text-gray-600 whitespace-pre-wrap">{selectedAssignment.instructions || "No instructions provided."}</p>
                </div>
                {selectedAssignment.attachment_url && (
                  <div>
                    <h3 className="font-medium text-gray-800">Pièce Jointe du Professeur</h3>
                    <a href={selectedAssignment.attachment_url} target="_blank" rel="noopener noreferrer" download className="mt-1 inline-flex items-center gap-2 text-blue-600 hover:underline">
                      <Download className="h-4 w-4" />
                      Télécharger le fichier joint
                    </a>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t flex justify-end">
                <button onClick={() => setShowDetailsModal(false)} className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

const AssignmentRow = ({ assignment, onViewDetails }: { assignment: StudentAssignment; onViewDetails: () => void; }) => {
  const getStatusButton = () => {
    switch (assignment.status) {
      case 'graded': return <button className="rounded-md bg-green-100 px-3 py-1 text-sm font-medium text-green-700 hover:bg-green-200">View Grade</button>;
      case 'submitted': return <button className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200">View Submission</button>;
      case 'pending': default: return <button className="rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200">Submit</button>;
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
        </div>
      </div>
    </div>
  );
};