import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createSupabaseClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        // When access tokens expire, automatically refresh them
        autoRefreshToken: true,
        // Keep your refresh token around (localStorage by default in the browser)
        persistSession: true,
        // (optional) detect auth state in URL hash after a redirect sign-in
        detectSessionInUrl: true,
      }
    }
  )
} 