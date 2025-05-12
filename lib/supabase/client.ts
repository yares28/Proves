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
        autoRefreshToken: true,
        persistSession: true
      }
    }
  )
} 