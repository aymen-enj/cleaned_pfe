import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from "../../../types/auth";
import { TeacherLayout } from "../../../components/dashboard/layout/teacher-layout";
// 1. CORRECTION : AJOUT DES ICÔNES MANQUANTES (Percent, Clock)
import { Calendar, Check, CheckCircle2, Download, Edit, Plus, Users, UserCheck, UserX, Bell, X, Percent, Clock } from "lucide-react";
import toast from 'react-hot-toast';

// --- TYPES/INTERFACES ---
interface ClassFromDB { id: string; name: string; }
interface StudentFromDB { id: string; firstName: string; lastName: string; }
interface ClassWithStatus extends ClassFromDB { totalStudents: number; presentCount: number; isCompleted: boolean; }
interface DashboardStats { totalClasses: number; presentToday: number; absentToday: number; attendanceRate: number; }
interface TeacherAttendanceProps { user: User; }

// --- SOUS-COMPOSANT POUR L'UI : SQUELETTE DE CHARGEMENT ---
const SkeletonLoader = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} />
);

// --- COMPOSANT PRINCIPAL ---
export default function TeacherAttendance({ user }: TeacherAttendanceProps) {
  // --- STATES ---
  const [showTakeAttendance, setShowTakeAttendance] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassFromDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [classes, setClasses] = useState<ClassFromDB[]>([]);
  const [students, setStudents] = useState<StudentFromDB[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [stats, setStats] = useState<DashboardStats>({ totalClasses: 0, presentToday: 0, absentToday: 0, attendanceRate: 0 });
  const [classesWithStatus, setClassesWithStatus] = useState<ClassWithStatus[]>([]);

  const todayFormatted = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full' }).format(new Date());

  // --- LOGIQUE DE DONNÉES (useEffect) ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!showTakeAttendance) {
        const { data: teacherClasses } = await supabase.from('classes').select('id, name');
        const { data: allEnrollments } = await supabase.from('class_enrollments').select('class_id');
        const { data: todaysAttendance } = await supabase.from('attendance').select('class_id, status').eq('date', new Date().toISOString().slice(0, 10));

        const combinedData = (teacherClasses || []).map(c => {
          const enrollmentsForClass = (allEnrollments || []).filter(e => e.class_id === c.id);
          const attendanceForClass = (todaysAttendance || []).filter(a => a.class_id === c.id);
          const presentCount = attendanceForClass.filter(a => a.status === 'present').length;
          return { id: c.id, name: c.name, totalStudents: enrollmentsForClass.length, presentCount, isCompleted: attendanceForClass.length > 0 };
        });
        setClassesWithStatus(combinedData);

        const totalPresent = (todaysAttendance || []).filter(a => a.status === 'present').length;
        const totalAbsent = (todaysAttendance || []).filter(a => a.status === 'absent').length;
        const rate = (totalPresent + totalAbsent) > 0 ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : 0;
        setStats({ totalClasses: (teacherClasses || []).length, presentToday: totalPresent, absentToday: totalAbsent, attendanceRate: rate });
      } else {
        const { data } = await supabase.from('classes').select('id, name');
        if (data) setClasses(data);
      }
      setLoading(false);
    };
    fetchData();
  }, [showTakeAttendance]);

  // --- FONCTIONS (HANDLERS) ---
  const handleClassSelect = async (classItem: ClassFromDB) => {
    setSelectedClass(classItem);
    setLoadingStudents(true);
    setStudents([]);
    setAttendanceStatus({});
    const { data: enrollments } = await supabase.from('class_enrollments').select('student_id').eq('class_id', classItem.id);
    if (!enrollments || enrollments.length === 0) { setLoadingStudents(false); return; }
    const studentIds = enrollments.map(e => e.student_id);
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name').in('id', studentIds);
    if (profiles) setStudents(profiles.map(p => ({ id: p.id, firstName: p.first_name || '', lastName: p.last_name || '' })));

    const { data: todaysAttendance } = await supabase.from('attendance').select('student_id, status').eq('class_id', classItem.id).eq('date', new Date().toISOString().slice(0, 10));
    if (todaysAttendance) {
      const statusMap = todaysAttendance.reduce((acc, record) => {
        acc[record.student_id] = record.status as 'present' | 'absent' | 'late';
        return acc;
      }, {} as Record<string, 'present' | 'absent' | 'late'>);
      setAttendanceStatus(statusMap);
    }
    setLoadingStudents(false);
  };

  const handleAttendanceStatus = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    if (!selectedClass) return;
    setAttendanceStatus(prev => ({ ...prev, [studentId]: status }));

    // 2. CORRECTION : On utilise la méthode await + toast manuels
    const toastId = toast.loading('Saving...'); // Affiche "Saving..."

    const { error } = await supabase.from('attendance').upsert({ date: new Date().toISOString().slice(0, 10), status, class_id: selectedClass.id, student_id: studentId }, { onConflict: 'date,class_id,student_id' });

    toast.dismiss(toastId); // On retire le message "Saving..."
    
    if (error) {
      toast.error('Could not save. Please try again.');
      console.error("Error saving attendance:", error);
    } else {
      toast.success('Attendance saved!');
    }
  };
  
  const handleNotify = (studentId: string) => toast(`Notifying parents of student ${studentId}...`);

  // --- AFFICHAGE (RENDER) ---
  if (showTakeAttendance) {
    return (
      <TeacherLayout user={user}>
        <div className="p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Take Attendance</h1>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-gray-600"><Calendar className="h-4 w-4" /><span>{todayFormatted}</span></div>
            </div>
            <button onClick={() => { setSelectedClass(null); setShowTakeAttendance(false); }} className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Back to Overview</button>
          </div>
          {!selectedClass ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loading ? Array.from({ length: 3 }).map((_, i) => <SkeletonLoader key={i} className="h-28 rounded-lg" />) : classes.map((c) => (<div key={c.id} onClick={() => handleClassSelect(c)} className="cursor-pointer rounded-lg border bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-md transition-all"><h3 className="font-semibold text-lg text-gray-900">{c.name}</h3></div>))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-gray-900">{selectedClass.name}</h2><button onClick={() => setSelectedClass(null)} className="text-sm font-medium text-blue-600 hover:underline">Choose Another Class</button></div>
              <div className="divide-y divide-gray-200 rounded-lg border bg-white shadow-sm">
                {loadingStudents ? Array.from({ length: 5 }).map((_, i) => (<div key={i} className="p-4 flex items-center justify-between"><div className="flex items-center gap-4"><SkeletonLoader className="h-10 w-10 rounded-full" /><div className="space-y-2"><SkeletonLoader className="h-4 w-32" /><SkeletonLoader className="h-3 w-20" /></div></div><SkeletonLoader className="h-8 w-24" /></div>)) : students.map((s) => (<div key={s.id} className="flex items-center justify-between p-4"><div className="flex items-center gap-4"><div className="flex-shrink-0"><div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center"><span className="text-gray-600 font-medium">{s.firstName?.[0]}{s.lastName?.[0]}</span></div></div><div><h4 className="font-medium text-gray-900">{s.firstName} {s.lastName}</h4><p className="text-sm text-gray-500">Status: {(attendanceStatus[s.id] || 'Pending').charAt(0).toUpperCase() + (attendanceStatus[s.id] || 'Pending').slice(1)}</p></div></div><div className="flex gap-2"><button title="Mark as present" onClick={() => handleAttendanceStatus(s.id, 'present')} className={`rounded-full p-2 transition-colors ${attendanceStatus[s.id] === 'present' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-green-100 hover:text-green-600'}`}><Check className="h-5 w-5" /></button><button title="Mark as absent" onClick={() => handleAttendanceStatus(s.id, 'absent')} className={`rounded-full p-2 transition-colors ${attendanceStatus[s.id] === 'absent' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-red-100 hover:text-red-600'}`}><X className="h-5 w-5" /></button><button title="Notify parents" onClick={() => handleNotify(s.id)} className="rounded-full p-2 text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"><Bell className="h-5 w-5" /></button></div></div>))}
              </div>
            </div>
          )}
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout user={user}>
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-gray-900">Attendance Overview</h1><p className="mt-1 text-sm text-gray-500">Your daily attendance summary</p></div>
          <div className="flex gap-3"><button onClick={() => setShowTakeAttendance(true)} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors"><Plus className="h-4 w-4" />Take Attendance</button></div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-4"><div className="bg-blue-100 rounded-lg p-3"><Users className="h-6 w-6 text-blue-600" /></div><div><p className="text-sm font-medium text-gray-500">Total Classes</p><p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.totalClasses}</p></div></div>
          <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-4"><div className="bg-green-100 rounded-lg p-3"><UserCheck className="h-6 w-6 text-green-600" /></div><div><p className="text-sm font-medium text-gray-500">Present Today</p><p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.presentToday}</p></div></div>
          <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-4"><div className="bg-red-100 rounded-lg p-3"><UserX className="h-6 w-6 text-red-600" /></div><div><p className="text-sm font-medium text-gray-500">Absent Today</p><p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.absentToday}</p></div></div>
          <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-4"><div className="bg-yellow-100 rounded-lg p-3"><Percent className="h-6 w-6 text-yellow-600" /></div><div><p className="text-sm font-medium text-gray-500">Attendance Rate</p><p className="text-2xl font-bold text-gray-900">{loading ? '...' : `${stats.attendanceRate}%`}</p></div></div>
        </div>

        <div className="space-y-4">
          <div><h3 className="text-lg font-medium text-gray-900">Today's Tasks</h3><p className="text-sm text-gray-500">A summary of your attendance tasks for today.</p></div>
          <div className="rounded-lg border bg-white shadow-sm"><div className="divide-y divide-gray-100">
            {loading ? Array.from({length: 2}).map((_, i)=><div key={i} className="p-4"><SkeletonLoader className="h-6 w-3/4" /></div>) : (classesWithStatus.length > 0 ? classesWithStatus.map(c => (
                <div key={c.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${c.isCompleted ? 'bg-green-100' : 'bg-orange-100'}`}>
                      {c.isCompleted ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Clock className="h-5 w-5 text-orange-600" />}
                    </div>
                    <div><p className="font-medium text-gray-800">{c.name}</p><p className="text-sm text-gray-500">{c.isCompleted ? `${c.presentCount} / ${c.totalStudents} students present` : `${c.totalStudents} students pending`}</p></div>
                  </div>
                  <button onClick={() => { handleClassSelect(c); setShowTakeAttendance(true); }} className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${c.isCompleted ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    {c.isCompleted ? <Edit className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    {c.isCompleted ? 'Edit' : 'Take Attendance'}
                  </button>
                </div>
              )) : <p className="p-4 text-sm text-gray-500">You have no classes assigned.</p>)}
          </div></div>
        </div>
      </div>
    </TeacherLayout>
  );
}