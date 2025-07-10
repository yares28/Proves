
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use secure server-side session management
        persistSession: false, // Don't persist on client
        autoRefreshToken: false, // Handle refresh server-side
        detectSessionInUrl: true,
        // Remove localStorage usage completely
        storage: undefined
      }
    }
  )
}

