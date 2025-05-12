/**
 * TokenManager - A centralized system for managing authentication tokens
 * across client and server boundaries in Next.js applications.
 * 
 * This handles the complex interactions between:
 * - localStorage (client-side persistence)
 * - cookies (cross-request and server-access)
 * - Supabase session objects
 */

import { createClient } from '@supabase/supabase-js';
import { Session } from '@supabase/supabase-js';

const STORAGE_KEY = 'supabase.auth.token';
const COOKIE_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds

// Cookie names that might contain authentication tokens
const AUTH_COOKIE_NAMES = [
  'sb-access-token',
  'sb-refresh-token',
  'sb:token'
];

// Create supabase client for token operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);

/**
 * Stores a session in both localStorage and cookies
 */
export async function storeSession(session: Session | null): Promise<boolean> {
  if (!session) {
    console.log('❌ storeSession: No session provided');
    return false;
  }
  
  try {
    // 1. Store in localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentSession: session
    }));
    console.log('✅ Session stored in localStorage', { 
      userId: session.user?.id,
      expiresAt: new Date(session.expires_at! * 1000).toISOString() 
    });
    
    // 2. Store in cookies for server access
    const domain = window.location.hostname;
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/^https?:\/\//, '');
    
    // Set all cookie variants to ensure server can access
    setCookie('sb-access-token', session.access_token);
    setCookie('sb-refresh-token', session.refresh_token);
    setCookie('sb:token', session.access_token);
    
    // Store full session in a cookie (with domain-specific name)
    setCookie(`sb-${baseUrl}-auth-token`, JSON.stringify(session));
    
    console.log('✅ Authentication cookies set for domain:', domain);
    return true;
  } catch (error) {
    console.error('❌ Failed to store session:', error);
    return false;
  }
}

/**
 * Helper to set cookies with standard parameters
 */
function setCookie(name: string, value: string): void {
  // For local development, don't set domain - this allows cookies to be sent in same-origin requests
  // Setting domain can sometimes prevent cookies from being included in server action requests
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_EXPIRY}; SameSite=Lax`;
  
  // Log the cookie being set
  console.log(`🍪 Setting cookie: ${name} (${value.substring(0, 10)}...)`);
}

/**
 * Refreshes and synchronizes token state
 * Call this before operations that require authentication
 */
export async function syncAuthState(): Promise<boolean> {
  console.log('🔄 Starting auth state synchronization...');
  
  try {
    // Get current session from Supabase
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting session:', error);
      return false;
    }
    
    if (!data?.session) {
      console.warn('⚠️ No active session found during sync');
      return false;
    }
    
    console.log('✅ Valid session found', { 
      userId: data.session.user.id,
      email: data.session.user.email,
      expiresAt: new Date(data.session.expires_at! * 1000).toISOString()
    });
    
    // Store the session in both localStorage and cookies
    await storeSession(data.session);
    
    // Force a refresh to update any expired tokens
    console.log('🔄 Refreshing session tokens...');
    await supabase.auth.refreshSession();
    
    // Output cookie debug info
    const cookies = document.cookie.split(';').map(c => c.trim());
    const authCookies = cookies.filter(c => 
      c.startsWith('sb-') || c.startsWith('sb:')
    );
    console.log('🍪 Auth cookies after sync:', authCookies);
    
    console.log('✅ Auth state synchronization complete');
    return true;
  } catch (error) {
    console.error('❌ Error syncing auth state:', error);
    return false;
  }
}

/**
 * Checks if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  console.log('🔍 Checking authentication status...');
  
  try {
    const { data } = await supabase.auth.getSession();
    const authenticated = !!data?.session;
    
    if (authenticated) {
      console.log('✅ User is authenticated', {
        userId: data.session?.user.id,
        expiresIn: data.session ? Math.floor((data.session.expires_at! * 1000 - Date.now()) / 1000) + ' seconds' : 'N/A'
      });
    } else {
      console.log('❌ User is not authenticated');
    }
    
    return authenticated;
  } catch (error) {
    console.error('❌ Error checking authentication:', error);
    return false;
  }
}

/**
 * Clears authentication state from both localStorage and cookies
 */
export async function clearAuthState(): Promise<void> {
  try {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
    
    // Clear all auth cookies
    const domain = window.location.hostname;
    
    AUTH_COOKIE_NAMES.forEach(name => {
      document.cookie = `${name}=; path=/; domain=${domain}; max-age=0; SameSite=Lax`;
    });
    
    // Also clear the domain-specific session cookie
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/^https?:\/\//, '');
    document.cookie = `sb-${baseUrl}-auth-token=; path=/; domain=${domain}; max-age=0; SameSite=Lax`;
    
    console.log('Auth state cleared from localStorage and cookies');
  } catch (error) {
    console.error('Error clearing auth state:', error);
  }
}

/**
 * Extracts auth tokens from localStorage
 * @returns Object containing access_token and refresh_token
 */
export function extractTokensFromStorage(): { accessToken: string | null; refreshToken: string | null } {
  console.log('🔍 Extracting tokens from localStorage...');
  
  try {
    const storedAuth = localStorage.getItem(STORAGE_KEY);
    if (!storedAuth) {
      console.warn('⚠️ No auth data found in localStorage');
      return { accessToken: null, refreshToken: null };
    }
    
    const authData = JSON.parse(storedAuth);
    const accessToken = authData?.currentSession?.access_token || null;
    const refreshToken = authData?.currentSession?.refresh_token || null;
    
    if (accessToken && refreshToken) {
      console.log('✅ Successfully extracted tokens', {
        accessTokenPreview: accessToken.substring(0, 10) + '...',
        refreshTokenAvailable: !!refreshToken
      });
      return { accessToken, refreshToken };
    } else {
      console.warn('⚠️ Incomplete token data in localStorage', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      });
      return { accessToken, refreshToken };
    }
  } catch (error) {
    console.error('❌ Error extracting tokens from localStorage:', error);
    return { accessToken: null, refreshToken: null };
  }
}

/**
 * Gets the full Supabase session from localStorage
 */
export function getSessionFromStorage(): Session | null {
  try {
    const storedAuth = localStorage.getItem(STORAGE_KEY);
    if (!storedAuth) return null;
    
    const authData = JSON.parse(storedAuth);
    return authData?.currentSession || null;
  } catch (error) {
    console.error('Error getting session from storage:', error);
    return null;
  }
} 