"use client"

import { 
  Home, 
  GraduationCap, 
  BookOpen, 
  FileText, 
  CreditCard, 
  Library,
  Award,
  Clock,
  ClipboardCheck,
  HelpCircle,
  LogOut // Ajout de l'icône LogOut
} from "lucide-react"
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react' // Ajout de useState
import { supabase } from '../../../lib/supabaseClient' // Ajout de supabase

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
    href: "/dashboard/student",
  },
  {
    title: "My Courses",
    icon: GraduationCap,
    href: "/dashboard/student/courses",
  },
  {
    title: "Course Materials",
    icon: BookOpen,
    href: "/dashboard/student/materials",
  },
  {
    title: "Digital Library",
    icon: Library,
    href: "/dashboard/student/library",
  },
  {
    title: "Certificates",
    icon: Award,
    href: "/dashboard/student/certificates",
  },
  {
    title: "Attendance",
    icon: Clock,
    href: "/dashboard/student/attendance",
  },
  {
    title: "Payments",
    icon: CreditCard,
    href: "/dashboard/student/payments",
  },
  {
    title: "Documents",
    icon: FileText,
    href: "/dashboard/student/documents",
  },
  {
    title: "Assignments",
    icon: ClipboardCheck,
    href: "/dashboard/student/assignments",
  },
  {
    title: "Support et Assistance",
    icon: HelpCircle,
    href: "/dashboard/student/support",
  },
]

export function StudentSidebar() {
  const location = useLocation()
  const [isLoggingOut, setIsLoggingOut] = useState(false) // État pour le loading

  // Fonction de déconnexion
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      // Le onAuthStateChange dans App.tsx s'occupera du reste !
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
                  <SidebarMenuButton isActive={location.pathname === item.href}>
                    <Link to={item.href} className="flex items-center">
                      <item.icon className="h-5 w-5" />
                      <span className="ml-3">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Bouton Logout ajouté ici */}
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