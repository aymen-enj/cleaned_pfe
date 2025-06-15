import { supabase } from './lib/supabaseClient';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/landing';
import { SignInPage } from './pages/auth/sign-in';
import { SignUpPage } from './pages/auth/sign-up';
import { ForgotPasswordPage } from './pages/auth/forgot-password';
import { ResetPasswordPage } from './pages/auth/reset-password';
import { AdminHomePage } from './pages/dashboard/admin/home';
import { UsersPage } from './pages/dashboard/admin/users';
import { ClassesPage } from './pages/dashboard/admin/classes';
import { SettingsPage } from './pages/dashboard/admin/settings';
import type { User, UserRole } from '@/types/auth';

import StudentDashboard from './pages/dashboard/student';
import StudentCourses from './pages/dashboard/student/courses';
import StudentMaterials from './pages/dashboard/student/materials';
import StudentLibrary from './pages/dashboard/student/library';
import StudentCertificates from './pages/dashboard/student/certificates';
import StudentAttendance from './pages/dashboard/student/attendance';
import StudentPayments from './pages/dashboard/student/payments';
import StudentDocuments from './pages/dashboard/student/documents';
import StudentAssignments from './pages/dashboard/student/assignments';
import StudentSupport from './pages/dashboard/student/support';

// Teacher Pages
import TeacherDashboard from './pages/dashboard/teacher';
import TeacherClasses from './pages/dashboard/teacher/classes';
import TeacherMaterials from './pages/dashboard/teacher/materials';
import TeacherStudents from './pages/dashboard/teacher/students';
import TeacherAttendance from './pages/dashboard/teacher/attendance';
import TeacherAssignments from './pages/dashboard/teacher/assignments';
import TeacherMessages from './pages/dashboard/teacher/messages';
import TeacherDocuments from './pages/dashboard/teacher/documents';

// Parent Pages
import ParentDashboard from './pages/dashboard/parent';
import ParentChildren from './pages/dashboard/parent/children';
import ParentProgress from './pages/dashboard/parent/progress';
import ParentMessages from './pages/dashboard/parent/messages';
import ParentPayments from './pages/dashboard/parent/payments';
import ParentDocuments from './pages/dashboard/parent/documents';

import DebugNav from "./pages/debug-nav";

// Composant pour rediriger selon le rôle
const RoleBasedRedirect = ({ user }: { user: User }) => {
  switch (user.role) {
    case 'administrator':
      return <Navigate to="/dashboard/admin" replace />;
    case 'teacher':
      return <Navigate to="/dashboard/teacher" replace />;
    case 'student':
      return <Navigate to="/dashboard/student" replace />;
    case 'parent':
      return <Navigate to="/dashboard/parent" replace />;
    default:
      return <Navigate to="/dashboard/student" replace />;
  }
};

// Composant pour protéger les routes
const ProtectedRoute = ({ children, user, allowedRoles }: { 
  children: React.ReactNode; 
  user: User | null; 
  allowedRoles?: UserRole[] 
}) => {
  if (!user) {
    return <Navigate to="/auth/sign-in" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <RoleBasedRedirect user={user} />;
  }
  
  return <>{children}</>;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAndSetUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session && session.user) {
        const validRoles: UserRole[] = ['administrator', 'teacher', 'student', 'parent'];
        const roleFromMeta = session.user.user_metadata?.role;
        const finalRole = validRoles.includes(roleFromMeta) ? roleFromMeta : 'student';

        const transformedUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: session.user.user_metadata?.firstName || 'Prénom',
          lastName: session.user.user_metadata?.lastName || 'Nom',
          role: finalRole,
        };
        
        setUser(transformedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkAndSetUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      console.log("Changement d'état d'authentification détecté !");
      checkAndSetUser();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  console.log("Rendu du composant App. Valeur de l'état 'user' :", user);

  return (
    <Router>
      <Routes>
        {/* Debug Route - Remove in production */}
        <Route path="/debug" element={<DebugNav />} />

        {/* Public Routes */}
        <Route 
          path="/" 
          element={user ? <RoleBasedRedirect user={user} /> : <LandingPage />} 
        />
        <Route 
          path="/auth/sign-in" 
          element={user ? <RoleBasedRedirect user={user} /> : <SignInPage />} 
        />
        <Route 
          path="/auth/sign-up" 
          element={user ? <RoleBasedRedirect user={user} /> : <SignUpPage />} 
        />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

        {/* Admin Routes */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute user={user} allowedRoles={['administrator']}>
              <AdminHomePage user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/users"
          element={
            <ProtectedRoute user={user} allowedRoles={['administrator']}>
              <UsersPage user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/classes"
          element={
            <ProtectedRoute user={user} allowedRoles={['administrator']}>
              <ClassesPage user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/settings"
          element={
            <ProtectedRoute user={user} allowedRoles={['administrator']}>
              <SettingsPage user={user!} />
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/dashboard/student"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <StudentDashboard user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/student/courses"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <StudentCourses user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/student/materials"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <StudentMaterials user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/student/library"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <StudentLibrary user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/student/certificates"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <StudentCertificates user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/student/attendance"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <StudentAttendance user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/student/payments"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <StudentPayments user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/student/documents"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <StudentDocuments user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/student/assignments"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <StudentAssignments user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/student/support"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <StudentSupport user={user!} />
            </ProtectedRoute>
          }
        />

        {/* Teacher Routes */}
        <Route
          path="/dashboard/teacher"
          element={
            <ProtectedRoute user={user} allowedRoles={['teacher']}>
              <TeacherDashboard user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher/classes"
          element={
            <ProtectedRoute user={user} allowedRoles={['teacher']}>
              <TeacherClasses user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher/materials"
          element={
            <ProtectedRoute user={user} allowedRoles={['teacher']}>
              <TeacherMaterials user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher/students"
          element={
            <ProtectedRoute user={user} allowedRoles={['teacher']}>
              <TeacherStudents user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher/attendance"
          element={
            <ProtectedRoute user={user} allowedRoles={['teacher']}>
              <TeacherAttendance user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher/assignments"
          element={
            <ProtectedRoute user={user} allowedRoles={['teacher']}>
              <TeacherAssignments user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher/messages"
          element={
            <ProtectedRoute user={user} allowedRoles={['teacher']}>
              <TeacherMessages user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher/documents"
          element={
            <ProtectedRoute user={user} allowedRoles={['teacher']}>
              <TeacherDocuments user={user!} />
            </ProtectedRoute>
          }
        />

        {/* Parent Routes */}
        <Route
          path="/dashboard/parent"
          element={
            <ProtectedRoute user={user} allowedRoles={['parent']}>
              <ParentDashboard user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/parent/children"
          element={
            <ProtectedRoute user={user} allowedRoles={['parent']}>
              <ParentChildren user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/parent/progress"
          element={
            <ProtectedRoute user={user} allowedRoles={['parent']}>
              <ParentProgress user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/parent/messages"
          element={
            <ProtectedRoute user={user} allowedRoles={['parent']}>
              <ParentMessages user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/parent/payments"
          element={
            <ProtectedRoute user={user} allowedRoles={['parent']}>
              <ParentPayments user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/parent/documents"
          element={
            <ProtectedRoute user={user} allowedRoles={['parent']}>
              <ParentDocuments user={user!} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
