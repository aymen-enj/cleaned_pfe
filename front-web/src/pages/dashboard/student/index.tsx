import { 
  GraduationCap, 
  BookOpen, 
  CreditCard, 
  Library,
  Award,
  Clock,
  ArrowRight
} from "lucide-react"
import { Link } from "react-router-dom"
import { StudentLayout } from "../../../components/dashboard/layout/student-layout"
import { User } from "../../../types/auth"

interface StudentDashboardProps {
  user: User
}

const features = [
  {
    name: "Course Registration",
    description: "Browse and register for available courses",
    icon: GraduationCap,
    href: "/dashboard/student/courses",
    color: "bg-blue-500",
  },
  {
    name: "Course Materials",
    description: "Access your course materials and resources",
    icon: BookOpen,
    href: "/dashboard/student/materials",
    color: "bg-green-500",
  },
  {
    name: "Digital Library",
    description: "Explore our digital library resources",
    icon: Library,
    href: "/dashboard/student/library",
    color: "bg-purple-500",
  },
  {
    name: "Certificates",
    description: "View and download your certificates",
    icon: Award,
    href: "/dashboard/student/certificates",
    color: "bg-yellow-500",
  },
  {
    name: "Attendance",
    description: "Check your attendance records",
    icon: Clock,
    href: "/dashboard/student/attendance",
    color: "bg-pink-500",
  },
  {
    name: "Payments",
    description: "Manage your payments and invoices",
    icon: CreditCard,
    href: "/dashboard/student/payments",
    color: "bg-indigo-500",
  },
]

export default function StudentDashboard({ user }: StudentDashboardProps) {
  return (
    <StudentLayout user={user}>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.firstName}!</h1>
          <p className="mt-1 text-sm text-gray-500">
            Access your courses, materials, and manage your academic journey
          </p>
        </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <div className="mt-4 rounded-lg border bg-white shadow">
          <div className="divide-y">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Course Material Updated</p>
                  <p className="text-sm text-gray-500">New materials added to Mathematics 101</p>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Payment Due</p>
                  <p className="text-sm text-gray-500">Upcoming payment for Spring Semester</p>
                </div>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Certificate Available</p>
                  <p className="text-sm text-gray-500">Introduction to Programming course completed</p>
                </div>
                <span className="text-sm text-gray-500">3 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </StudentLayout>
  )
} 