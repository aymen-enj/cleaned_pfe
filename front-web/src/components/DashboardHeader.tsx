import { LogoutButton } from './LogoutButton';
import type { User } from '@/types/auth';

interface DashboardHeaderProps {
  user: User;
  title: string;
  subtitle?: string;
}

export const DashboardHeader = ({ user, title, subtitle }: DashboardHeaderProps) => {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'Administrateur';
      case 'teacher':
        return 'Enseignant';
      case 'student':
        return 'Étudiant';
      case 'parent':
        return 'Parent';
      default:
        return role;
    }
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500">
                {getRoleLabel(user.role)}
              </p>
            </div>
            
            <LogoutButton size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
};