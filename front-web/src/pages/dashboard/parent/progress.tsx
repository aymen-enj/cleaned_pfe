import { useState, useEffect } from "react";
import { User } from "../../../types/auth";
import { ParentLayout } from "../../../components/dashboard/layout/parent-layout";
import { BarChart, TrendingUp, BookOpen, Award, ChevronDown } from "lucide-react";
import { Bar, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler);

// --- Types ---
interface Child { id: string; first_name: string; last_name: string; }
interface Stats { gpa: number; attendanceRate: number; completedCourses: number; awards: number; }
interface ParentProgressProps { user: User; }

const performanceOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' as const }, title: { display: false } },
  scales: { y: { beginAtZero: true, max: 100 } },
};
const skillsOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' as const }, title: { display: false } },
  scales: { r: { angleLines: { display: false }, suggestedMin: 0, suggestedMax: 100 } },
};

export default function ParentProgress({ user }: ParentProgressProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ gpa: 0, attendanceRate: 0, completedCourses: 0, awards: 0 });
  const [performanceData, setPerformanceData] = useState<any>({ labels: [], datasets: [] });
  const [skillsData, setSkillsData] = useState<any>({ labels: [], datasets: [] });

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const { data: relations, error: relationsError } = await supabase.from('parent_child_relations').select('child_id').eq('parent_id', user.id);
        if (relationsError) throw relationsError;
        if (!relations || relations.length === 0) {
          setChildren([]); setLoading(false); return;
        }
        const childIds = relations.map(r => r.child_id);
        const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, first_name, last_name').in('id', childIds);
        if (profilesError) throw profilesError;
        setChildren(profiles || []);
        if (profiles && profiles.length > 0) {
          setSelectedChildId(profiles[0].id);
        } else {
          setLoading(false);
        }
      } catch (error: any) {
        toast.error("Could not load your children's data.");
        console.error("Error fetching children:", error);
        setLoading(false);
      }
    };
    fetchChildren();
  }, [user.id]);

  useEffect(() => {
    if (!selectedChildId) {
        setLoading(false);
        return;
    }
    const fetchChildData = async () => {
      setLoading(true);
      try {
        const [attendanceResult, gradesResult, skillsResult, monthlyGradesResult] = await Promise.all([
          supabase.from('attendance').select('status').eq('student_id', selectedChildId),
          supabase.from('submissions').select('grade').eq('student_id', selectedChildId).not('grade', 'is', null),
          supabase.from('skill_assessments').select('skill_name, score').eq('student_id', selectedChildId),
          supabase.from('monthly_grades').select('month_date, average_grade, classes(name)').eq('student_id', selectedChildId).order('month_date')
        ]);
        
        if (attendanceResult.error) throw attendanceResult.error;
        if (gradesResult.error) throw gradesResult.error;
        if (skillsResult.error) throw skillsResult.error;
        if (monthlyGradesResult.error) throw monthlyGradesResult.error;

        const attendanceData = attendanceResult.data || [];
        const gradesData = gradesResult.data || [];
        const totalDays = attendanceData.length;
        const presentDays = attendanceData.filter(a => a.status === 'present').length;
        const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;
        const totalGrades = gradesData.reduce((sum, item) => sum + (item.grade || 0), 0);
        const gpa = gradesData.length > 0 ? parseFloat((totalGrades / gradesData.length / 25).toFixed(1)) : 4.0;
        setStats(prev => ({ ...prev, attendanceRate, gpa }));

        if (monthlyGradesResult.data) {
          // helper to safely derive class name regardless of object/array/null
          const extractClassName = (cls: any): string | undefined => {
            if (!cls) return undefined;
            return Array.isArray(cls) ? cls[0]?.name : cls?.name;
          };
          const data = monthlyGradesResult.data;
          const labels = [...new Set(data.map(d => new Date(d.month_date).toLocaleString('fr-FR', { month: 'short' })))] as string[];
          const subjects = [...new Set(data.map(d => extractClassName(d.classes)).filter(Boolean))] as string[];
          const datasets = subjects.map((subject, index) => ({
            label: subject,
            data: labels.map(label => {
              const monthData = data.find(d => new Date(d.month_date).toLocaleString('fr-FR', { month: 'short' }) === label && extractClassName(d.classes) === subject);
              return monthData ? monthData.average_grade : null;
            }),
            backgroundColor: index === 0 ? 'rgba(75, 192, 192, 0.5)' : 'rgba(153, 102, 255, 0.5)',
          }));
          setPerformanceData({ labels, datasets });
        }
        
        if (skillsResult.data) {
          setSkillsData({ labels: skillsResult.data.map(s => s.skill_name), datasets: [{ label: 'Skills', data: skillsResult.data.map(s => s.score), backgroundColor: 'rgba(255, 99, 132, 0.2)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 1 }] });
        }

      } catch (error: any) {
        toast.error("Could not load child's progress.");
        console.error("Error fetching child data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChildData();
  }, [selectedChildId]);

  const selectedChildName = children.find(c => c.id === selectedChildId)?.first_name || "your child";

  return (
    <ParentLayout user={user}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Academic Progress</h1><p className="mt-1 text-sm text-gray-500">Track {selectedChildName}'s academic performance</p></div>
          <div className="relative">
            <select aria-label="Select Child" value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)} className="appearance-none w-48 px-4 py-2 pr-8 rounded-md border border-gray-300 shadow-sm" disabled={loading || children.length === 0}>
              {children.length === 0 && !loading ? (<option>No children found</option>) : (children.map(child => (<option key={child.id} value={child.id}>{child.first_name} {child.last_name}</option>)))}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-lg border bg-white p-6 shadow-sm"><h3 className="text-sm font-medium text-gray-500">Overall GPA</h3><p className="mt-2 text-3xl font-semibold text-gray-900">{loading ? '...' : stats.gpa.toFixed(1)}</p></div>
          <div className="rounded-lg border bg-white p-6 shadow-sm"><h3 className="text-sm font-medium text-gray-500">Attendance Rate</h3><p className="mt-2 text-3xl font-semibold text-blue-600">{loading ? '...' : `${stats.attendanceRate}%`}</p></div>
          <div className="rounded-lg border bg-white p-6 shadow-sm"><h3 className="text-sm font-medium text-gray-500">Completed Courses</h3><p className="mt-2 text-3xl font-semibold text-green-600">{stats.completedCourses}</p></div>
          <div className="rounded-lg border bg-white p-6 shadow-sm"><h3 className="text-sm font-medium text-gray-500">Awards</h3><p className="mt-2 text-3xl font-semibold text-purple-600">{stats.awards}</p></div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><BarChart className="h-5 w-5 text-blue-600" />Academic Performance</h2>
            <div className="h-72">{loading ? <p>Loading chart...</p> : (performanceData?.datasets?.[0]?.data?.length > 0 ? <Bar options={performanceOptions} data={performanceData} /> : <p className="text-center text-gray-500 mt-16">No performance data available.</p>)}</div>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-purple-600" />Skills Assessment</h2>
            <div className="h-72">{loading ? <p>Loading chart...</p> : (skillsData?.datasets?.[0]?.data?.length > 0 ? <Radar data={skillsData} options={skillsOptions} /> : <p className="text-center text-gray-500 mt-16">No skills data available.</p>)}</div>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-gray-900">Subject Performance</h2></div><div className="mt-4 space-y-4">{/* ... */}</div></div>
          <div className="rounded-lg border bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-gray-900">Recent Achievements</h2></div><div className="mt-4 space-y-4">{/* ... */}</div></div>
        </div>
      </div>
    </ParentLayout>
  );
}