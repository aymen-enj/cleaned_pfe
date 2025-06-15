import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import type { SignInData } from '../../types/auth'
import { supabase } from '@/lib/supabaseClient' // 1. Importer Supabase

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const SignInPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  // Ajout de 'setError' pour afficher les erreurs de Supabase dans le formulaire
  const { register, handleSubmit, formState: { errors }, setError } = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: SignInData) => {
    setIsLoading(true)
    try {
      // 2. Remplacer le TODO par l'appel à Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      // 3. Gérer la réponse de Supabase
      if (error) {
        // Affiche une erreur générale au-dessus du formulaire si la connexion échoue
        setError('root.serverError', { 
          type: 'manual', 
          message: 'Invalid login credentials. Please try again.' 
        });
        console.error('Supabase sign in error:', error.message);
      } else {
        // C'est tout ! App.tsx s'occupera du reste.
        // La redirection sera automatique grâce au onAuthStateChange.
      }

    } catch (error) {
      // Gérer les erreurs inattendues (ex: problème réseau)
      setError('root.serverError', {
        type: 'manual',
        message: 'An unexpected error occurred. Please try again later.'
      });
      console.error('Unexpected sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/auth/sign-up" className="font-medium text-primary hover:text-primary/90">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Affichage de l'erreur générale du serveur */}
            {errors.root?.serverError && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-600">{errors.root.serverError.message}</p>
              </div>
            )}
            
            {/* ... le reste de votre formulaire est parfait et reste inchangé ... */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/auth/reset-password" className="font-medium text-primary hover:text-primary/90">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}