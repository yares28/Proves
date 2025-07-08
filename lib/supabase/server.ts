'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

/**
 * Creates a Supabase client for server-side use with automatic token refresh handling.
 * Attempts to extract authentication tokens from cookies and refreshes them if expired.
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
  
  // For user operations, create a client that can handle token refresh
  const client = createSupabaseClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        autoRefreshToken: false, // We'll handle refresh manually on server
        persistSession: false    // Server doesn't persist its own session
      }
    }
  );
  
  // Try to get tokens from cookies and refresh if needed
  await handleServerTokens(client);
  
  return client;
}

/**
 * Handles token extraction and refresh for server-side operations
 */
async function handleServerTokens(client: any) {
  const cookieStore = cookies();
  
  // Try to extract tokens from various cookie formats
  const tokens = await extractTokensFromCookies(cookieStore);
  
  if (!tokens) {
    console.log('❌ [SERVER] No auth tokens found in cookies');
    return;
  }
  
  const { accessToken, refreshToken } = tokens;
  
  // Check if access token is expired
  if (isTokenExpired(accessToken)) {
    console.log('🔄 [SERVER] Access token is expired, attempting refresh...');
    
    if (refreshToken) {
      try {
        // Use the refresh token to get new tokens
        const { data, error } = await client.auth.refreshSession({ 
          refresh_token: refreshToken 
        });
        
        if (error) {
          console.error('❌ [SERVER] Token refresh failed:', error.message);
          return;
        }
        
        if (data?.session) {
          console.log('✅ [SERVER] Token refreshed successfully on server');
          
          // Set the refreshed session on the client
          await client.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });
          
          // TODO: Update cookies with new tokens (if needed for next request)
          // This would require setting cookies in the response, which is tricky in server actions
          
          return;
        }
      } catch (error) {
        console.error('❌ [SERVER] Error during token refresh:', error);
      }
    }
    
    console.log('❌ [SERVER] Unable to refresh expired token');
    return;
  }
  
  // Token is still valid, set it on the client
  if (refreshToken) {
    try {
      await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      
      console.log('✅ [SERVER] Valid session set from cookies');
    } catch (error) {
      console.error('❌ [SERVER] Error setting session:', error);
    }
  } else {
    // Fallback to just setting the Authorization header
    client.auth.setAuth(accessToken);
    console.log('✅ [SERVER] Using access token from cookies (no refresh token)');
  }
}

/**
 * Extracts tokens from cookies in various formats
 */
async function extractTokensFromCookies(cookieStore: any): Promise<{ accessToken: string; refreshToken?: string } | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/^https?:\/\//, '').replace(/\..*$/, '');
  
  // Simple function to safely get cookie value
  const getCookieValue = async (name: string): Promise<string | undefined> => {
    try {
      const jar = await cookieStore;
      return jar.get(name)?.value;
    } catch (e) {
      return undefined;
    }
  };
  
  // 1. Try the direct access token cookie
  let accessToken = await getCookieValue('sb-access-token');
  let refreshToken = await getCookieValue('sb-refresh-token');
  
  if (accessToken) {
    console.log('✅ [SERVER] Found tokens in direct cookies');
    return { accessToken, refreshToken };
  }
  
  // 2. Try the alternate token format
  accessToken = await getCookieValue('sb:token');
  if (accessToken) {
    console.log('✅ [SERVER] Found token in sb:token cookie');
    return { accessToken };
  }
  
  // 3. Try the domain-specific session cookie
  const sessionCookieName = `sb-${baseUrl}-auth-token`;
  const fullSessionCookie = await getCookieValue(sessionCookieName);
  
  if (fullSessionCookie) {
    try {
      const sessionData = JSON.parse(fullSessionCookie);
      if (sessionData.access_token) {
        console.log('✅ [SERVER] Extracted tokens from full session cookie');
        return {
          accessToken: sessionData.access_token,
          refreshToken: sessionData.refresh_token
        };
      } else if (sessionData.currentSession?.access_token) {
        console.log('✅ [SERVER] Extracted tokens from currentSession object');
        return {
          accessToken: sessionData.currentSession.access_token,
          refreshToken: sessionData.currentSession.refresh_token
        };
      }
    } catch (e) {
      console.error('❌ [SERVER] Error parsing session cookie:', e);
    }
  }
  
  return null;
}

/**
 * Checks if a JWT token is expired
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    
    // Consider token expired if it expires within the next minute
    return expirationTime <= (currentTime + 60000);
  } catch (error) {
    console.error('❌ [SERVER] Error parsing token:', error);
    return true; // Assume expired if we can't parse it
  }
}

/**
 * Creates a Supabase admin client with service role key
 * Use this for administrative operations that bypass RLS
 */
export async function createAdminClient() {
  return await createClient(true);
} 