
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use secure server-side session management
        persistSession: true, // Enable session persistence for OAuth
        autoRefreshToken: true, // Enable auto refresh for OAuth
        detectSessionInUrl: true,
        // Custom storage that works with our hybrid approach
        storage: {
          getItem: (key) => {
            if (typeof window === "undefined") return null
            // For client-side, we'll use a minimal localStorage approach
            // but the main session management happens server-side
            try {
              const stored = localStorage.getItem(key)
              return stored
            } catch {
              return null
            }
          },
          setItem: (key, value) => {
            if (typeof window === "undefined") return
            try {
              localStorage.setItem(key, value)
            } catch {
              // Ignore localStorage errors
            }
          },
          removeItem: (key) => {
            if (typeof window === "undefined") return
            try {
              localStorage.removeItem(key)
            } catch {
              // Ignore localStorage errors
            }
          }
        }
      }
    }
  )
}

