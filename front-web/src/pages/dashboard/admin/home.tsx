import { DashboardLayout } from '../../../components/dashboard/layout/dashboard-layout'
import { EnrollmentTrendChart } from '../../../components/dashboard/charts/enrollment-trend-chart'
import { TeacherStudentRatioChart } from '../../../components/dashboard/charts/teacher-student-ratio-chart'
import { AttendanceSummaryChart } from '../../../components/dashboard/charts/attendance-summary-chart'
import { QuickStatsSection } from '../../../components/dashboard/sections/quick-stats-section'
import { RecentActivitiesSection } from '../../../components/dashboard/sections/recent-activities-section'
import { User } from '../../../types/auth'
import { supabase } from '@/lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

interface AdminHomePageProps {
  user: User
}

export const AdminHomePage = ({ user }: AdminHomePageProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  }
  const quickStats = [
    {
      title: 'Total Students',
      value: '2,456',
      change: { value: 12, trend: 'up' as const },
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      title: 'Total Teachers',
      value: '128',
      change: { value: 5, trend: 'up' as const },
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
    {
      title: 'Total Classes',
      value: '64',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      title: 'Total Parents',
      value: '3,842',
      change: { value: 8, trend: 'up' as const },
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ]

  const recentActivities = [
    {
      id: '1',
      type: 'registration' as const,
      title: 'New Student Registration',
      description: 'John Doe has been registered as a new student',
      timestamp: new Date('2024-01-15T09:30:00'),
    },
    {
      id: '2',
      type: 'payment' as const,
      title: 'Tuition Payment Received',
      description: 'Payment of $1,500 received from Sarah Smith',
      timestamp: new Date('2024-01-15T10:15:00'),
    },
    {
      id: '3',
      type: 'attendance' as const,
      title: 'Attendance Report',
      description: 'Class 10A attendance marked for today',
      timestamp: new Date('2024-01-15T11:00:00'),
    },
    {
      id: '4',
      type: 'grade' as const,
      title: 'Grades Updated',
      description: 'Mathematics exam grades updated for Class 9B',
      timestamp: new Date('2024-01-15T11:45:00'),
    },
    {
      id: '5',
      type: 'system' as const,
      title: 'System Maintenance',
      description: 'Scheduled system maintenance completed',
      timestamp: new Date('2024-01-15T12:30:00'),
    },
  ]

  return (
    <DashboardLayout user={user}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Overview of your school's performance and recent activities</p>
          </div>
          <button onClick={handleSignOut} className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
            Sign out
          </button>
        </div>

        {/* Quick Stats Section */}
        <QuickStatsSection stats={quickStats} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Enrollment Trend</h3>
            <EnrollmentTrendChart />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Teacher-Student Ratio</h3>
            <TeacherStudentRatioChart />
          </div>
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Attendance Summary</h3>
            <AttendanceSummaryChart />
          </div>
        </div>

        {/* Recent Activities Section */}
        <RecentActivitiesSection activities={recentActivities} />
      </div>
    </DashboardLayout>
  )
}
