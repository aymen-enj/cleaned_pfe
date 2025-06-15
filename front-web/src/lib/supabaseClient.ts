import { createClient } from '@supabase/supabase-js'

// TypeScript a besoin de savoir que ces variables existent sur import.meta.env
// On récupère les variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// On s'assure qu'elles ne sont pas vides
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be defined in the .env file")
}

// On crée et on exporte le client
// Le type est automatiquement déduit par TypeScript, c'est la magie !
export const supabase = createClient(supabaseUrl, supabaseAnonKey)