import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const LogoutButton = ({ 
  className = '', 
  variant = 'danger',
  size = 'sm',
  showIcon = true
}: LogoutButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      // Le onAuthStateChange dans App.tsx s'occupera du reste !
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      default:
        return 'bg-red-600 hover:bg-red-700 text-white';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        font-medium rounded-md
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        flex items-center gap-2
        ${className}
      `}
    >
      {showIcon && <LogOut className="h-4 w-4" />}
      {isLoading ? 'Déconnexion...' : 'Logout'}
    </button>
  );
};