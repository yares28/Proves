'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

/**
 * Creates a Supabase client for server-side use with robust authentication handling.
 * Attempts to extract authentication tokens from cookies in various formats.
 * 
 * @param useServiceRole - If true, uses the service role key for admin operations
 */
export async function createClient(useServiceRole: boolean = false) {
  console.log(`🔄 [SERVER] Creating server-side Supabase client${useServiceRole ? ' (Service Role)' : ' (User Auth)'}...`);
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  
  // Use service role key for admin operations, anon key for user operations
  const supabaseKey = useServiceRole 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (useServiceRole && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }
  
  // If using service role, don't try to get user tokens
  if (useServiceRole) {
    console.log('✅ [SERVER] Using service role key for admin operations');
    return createSupabaseClient<Database>(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
  
  // Continue with user authentication logic for regular operations
  // Normalize the base URL for cookie name matching
  const baseUrl = supabaseUrl.replace(/^https?:\/\//, '').replace(/\..*$/, '');
  
  // Try different cookie formats in priority order
  let token: string | undefined;
  
  // Get the cookieStore
  const cookieStore = cookies();
  
  // Simple function to safely check if cookie exists
  const cookieExists = async (name: string): Promise<boolean> => {
    try {
      const cookieJar = await cookieStore;
      return cookieJar.has(name);
    } catch (e) {
      console.error(`Error checking for cookie ${name}:`, e);
      return false;
    }
  };
  
  // Simple function to safely get cookie value
  const getCookieValue = async (name: string): Promise<string | undefined> => {
    try {
      const cookieJar = await cookieStore;
      return cookieJar.get(name)?.value;
    } catch (e) {
      console.error(`Error getting cookie ${name}:`, e);
      return undefined;
    }
  };
  
  // Log available cookies for debugging
  console.log('📋 [SERVER] Checking for auth cookies');
  
  // 1. Try the direct access token cookie
  if (await cookieExists('sb-access-token')) {
    token = await getCookieValue('sb-access-token');
    if (token) console.log('✅ [SERVER] Using sb-access-token');
  }
  
  // 2. Try the alternate token format
  if (!token && await cookieExists('sb:token')) {
    token = await getCookieValue('sb:token');
    if (token) console.log('✅ [SERVER] Using sb:token');
  }
  
  // 3. Try the domain-specific session cookie
  const sessionCookieName = `sb-${baseUrl}-auth-token`;
  if (!token && await cookieExists(sessionCookieName)) {
    const fullSessionCookie = await getCookieValue(sessionCookieName);
    if (fullSessionCookie) {
      try {
        // This cookie might contain the full session JSON
        const sessionData = JSON.parse(fullSessionCookie);
        if (sessionData.access_token) {
          token = sessionData.access_token;
          console.log('✅ [SERVER] Extracted token from full session cookie');
        } else if (sessionData.currentSession?.access_token) {
          token = sessionData.currentSession.access_token;
          console.log('✅ [SERVER] Extracted token from currentSession object');
        }
      } catch (e) {
        console.error('❌ [SERVER] Error parsing session cookie:', e);
      }
    }
  }
  
  // Debug logging
  if (token) {
    console.log('✅ [SERVER] Auth token available, first 10 chars:', token.substring(0, 10) + '...');
  } else {
    console.log('❌ [SERVER] No auth token found in cookies');
    
    // List auth cookies status
    const authCookies = ['sb-access-token', 'sb:token', 'sb-refresh-token', sessionCookieName];
    for (const name of authCookies) {
      const exists = await cookieExists(name);
      console.log(`[SERVER] ${name}: ${exists ? 'present' : 'missing'}`);
    }
  }
  
  // Create the client with the authentication token if available
  const client = createSupabaseClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      },
      auth: {
        autoRefreshToken: false, // Server-side doesn't need auto-refresh
        persistSession: false    // Server doesn't persist its own session
      }
    }
  );
  
  // Verify session with the created client
  try {
    const { data } = await client.auth.getSession();
    if (data.session) {
      console.log('✅ [SERVER] Server client successfully verified session for user:', data.session.user.id);
    } else {
      console.log('⚠️ [SERVER] Server client created but no valid session found');
    }
  } catch (error) {
    console.error('❌ [SERVER] Error verifying session with server client:', error);
  }
  
  return client;
}

/**
 * Creates a Supabase admin client with service role key
 * Use this for administrative operations that bypass RLS
 */
export async function createAdminClient() {
  return await createClient(true);
} 