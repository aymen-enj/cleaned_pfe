import { 
  Home, 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Users,
  Calendar,
  ClipboardCheck,
  MessageSquare,
  LogOut
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../../../components/ui/sidebar"

const navigation = [
  {
    title: "Overview",
    icon: Home,
    href: "/dashboard/teacher",
  },
  {
    title: "My Classes",
    icon: GraduationCap,
    href: "/dashboard/teacher/classes",
  },
  {
    title: "Course Materials",
    icon: BookOpen,
    href: "/dashboard/teacher/materials",
  },
  {
    title: "Students",
    icon: Users,
    href: "/dashboard/teacher/students",
  },
  {
    title: "Attendance",
    icon: Calendar,
    href: "/dashboard/teacher/attendance",
  },
  {
    title: "Assignments",
    icon: ClipboardCheck,
    href: "/dashboard/teacher/assignments",
  },
  {
    title: "Messages",
    icon: MessageSquare,
    href: "/dashboard/teacher/messages",
  },
  {
    title: "Documents",
    icon: FileText,
    href: "/dashboard/teacher/documents",
  },
]

export function TeacherSidebar() {
  const location = useLocation()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.href}>
                    <Link to={item.href} className="flex items-center">
                      <item.icon className="h-5 w-5" />
                      <span className="ml-3">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center w-full text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="ml-3">
                      {isLoggingOut ? 'Déconnexion...' : 'Logout'}
                    </span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
