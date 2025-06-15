import { 
  GraduationCap, 
  Users, 
  ClipboardCheck, 
  MessageSquare,
  ArrowRight,
  Calendar
} from "lucide-react"
import { Link } from "react-router-dom"
import { User } from "../../../types/auth"
import { TeacherLayout } from "../../../components/dashboard/layout/teacher-layout"
import { DashboardHeader } from '@/components/DashboardHeader'
import { LogoutButton } from '@/components/LogoutButton'

interface TeacherDashboardProps {
  user: User
}

const features = [
  {
    name: "My Classes",
    description: "Manage your classes and course schedules",
    icon: GraduationCap,
    href: "/dashboard/teacher/classes",
    color: "bg-blue-500",
  },
  {
    name: "Students",
    description: "View and manage student information",
    icon: Users,
    href: "/dashboard/teacher/students",
    color: "bg-green-500",
  },
  {
    name: "Assignments",
    description: "Create and grade assignments",
    icon: ClipboardCheck,
    href: "/dashboard/teacher/assignments",
    color: "bg-purple-500",
  },
  {
    name: "Messages",
    description: "Communicate with students and staff",
    icon: MessageSquare,
    href: "/dashboard/teacher/messages",
    color: "bg-yellow-500",
  },
]

export default function TeacherDashboard({ user }: TeacherDashboardProps) {
  return (
    <TeacherLayout user={user}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.firstName}!</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your classes, students, and teaching materials
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500">Active Classes</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">6</p>
            <p className="mt-1 text-sm text-gray-500">This semester</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Students</h3>
            <p className="mt-2 text-3xl font-semibold text-blue-600">180</p>
            <p className="mt-1 text-sm text-gray-500">Across all classes</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500">Pending Assignments</h3>
            <p className="mt-2 text-3xl font-semibold text-yellow-600">8</p>
            <p className="mt-1 text-sm text-gray-500">To be graded</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500">Today's Classes</h3>
            <p className="mt-2 text-3xl font-semibold text-green-600">3</p>
            <p className="mt-1 text-sm text-gray-500">Upcoming today</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Link
              key={feature.name}
              to={feature.href}
              className="group relative overflow-hidden rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center">
                <div className={`${feature.color} rounded-lg p-3`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{feature.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

        {/* Today's Schedule */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
          <div className="mt-4 rounded-lg border bg-white shadow">
            <div className="divide-y">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Mathematics 101</h3>
                      <p className="text-sm text-gray-500">Room 204 • 10:00 AM - 11:30 AM</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
                    In 30 minutes
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-purple-100 p-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Physics 201</h3>
                      <p className="text-sm text-gray-500">Lab 3 • 2:00 PM - 3:30 PM</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800">
                    Later today
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  )
} 
