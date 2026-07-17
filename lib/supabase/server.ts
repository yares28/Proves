'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

/**
 * Creates a Supabase client for server-side use.
 *
 * For user operations the returned client starts unauthenticated; callers apply
 * the user's session with `supabase.auth.setSession(...)` using tokens passed
 * from the client, then re-validate with `getUser()`. For admin operations the
 * service-role key is used (bypasses RLS — never expose it to the client).
 *
 * @param useServiceRole - If true, uses the service role key for admin operations.
 */
export async function createClient(useServiceRole: boolean = false) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  const supabaseKey = useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (useServiceRole && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Creates a Supabase admin client with the service role key.
 * Use only for administrative operations that must bypass RLS.
 */
export async function createAdminClient() {
  return await createClient(true)
}
