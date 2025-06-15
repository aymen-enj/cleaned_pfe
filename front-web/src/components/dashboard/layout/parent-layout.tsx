import { ReactNode } from 'react'
import { User } from '../../../types/auth'
import { ParentSidebar } from './parent-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../../../components/ui/sidebar'
import { Separator } from '../../../components/ui/separator'
import { Toaster } from 'react-hot-toast'

interface ParentLayoutProps {
  children: ReactNode
  user: User
}

export const ParentLayout = ({ children, user }: ParentLayoutProps) => {
  return (
    <SidebarProvider>
      <ParentSidebar />
      <SidebarInset>
        <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <div className="font-semibold">Parent Portal</div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
              <div>Parent</div>
            </div>
            <button className="flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary">
              {user.profilePicture ? (
                <img
                  className="h-8 w-8 rounded-full"
                  src={user.profilePicture}
                  alt=""
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
              )}
            </button>
          </div>
        </header>
        <main className="flex-1 bg-gray-50">
          {children}
        </main>
      </SidebarInset>
      
      {/* Ajout du Toaster pour les notifications */}
      <Toaster 
        position="bottom-right" 
        toastOptions={{ 
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#EF4444',
            },
          },
        }} 
      />
    </SidebarProvider>
  )
}
