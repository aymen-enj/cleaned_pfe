import { 
  Home, 
  Users, 
  MessageSquare,
  CreditCard,
  FileText,
  BarChart,
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
    href: "/dashboard/parent",
  },
  {
    title: "Children",
    icon: Users,
    href: "/dashboard/parent/children",
  },
  {
    title: "Academic Progress",
    icon: BarChart,
    href: "/dashboard/parent/progress",
  },
  {
    title: "Messages",
    icon: MessageSquare,
    href: "/dashboard/parent/messages",
  },
  {
    title: "Payments",
    icon: CreditCard,
    href: "/dashboard/parent/payments",
  },
  {
    title: "Documents",
    icon: FileText,
    href: "/dashboard/parent/documents",
  },
]

export function ParentSidebar() {
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
