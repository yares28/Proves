import { createClient } from '@supabase/supabase-js'

// Create direct client instance
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Helper function to check the current authentication state and fix any issues
 * with localStorage persistence.
 * 
 * @returns {Promise<boolean>} True if the token was fixed, false otherwise
 */
export async function checkAndFixAuthState() {
  // Check localStorage
  console.log("Current localStorage auth token:", localStorage.getItem('supabase.auth.token'));
  
  // Check if there's a session with Supabase
  const { data } = await supabase.auth.getSession();
  console.log("Current Supabase session:", data?.session);
  
  // If we have a session but localStorage is wrong, fix it
  if (data?.session && (!localStorage.getItem('supabase.auth.token') || 
      localStorage.getItem('supabase.auth.token') === 'true')) {
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      currentSession: data.session
    }));
    console.log("Fixed localStorage token");
    return true;
  }
  
  return false;
}

/**
 * Run this in the browser console to immediately fix authentication issues
 */
export async function fixAuth() {
  const { data } = await supabase.auth.getSession();
  if (data?.session) {
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      currentSession: data.session
    }));
    console.log("Session fixed, try the My Calendar button now");
    return true;
  } else {
    console.log("No active session found, please log in first");
    return false;
  }
}

/**
 * Synchronizes the authentication state between client localStorage and server cookies.
 * This is important for server actions that require authentication.
 */
export async function syncAuthState() {
  try {
    // Get the current session from Supabase client
    const { data } = await supabase.auth.getSession()
    
    if (!data?.session) {
      console.warn('No active session found when syncing auth state')
      return false
    }
    
    // Ensure localStorage has correct token format
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      currentSession: data.session
    }))
    
    // Update cookies to ensure server can recognize auth
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/^https?:\/\//, '')
    const domain = window.location.hostname
    
    // Set all possible cookie formats that the server might check
    document.cookie = `sb-access-token=${data.session.access_token}; path=/; domain=${domain}; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; domain=${domain}; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    document.cookie = `sb:token=${data.session.access_token}; path=/; domain=${domain}; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    document.cookie = `sb-${baseUrl}-auth-token=${JSON.stringify(data.session)}; path=/; domain=${domain}; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    
    console.log('Auth state synchronized successfully')
    return true
  } catch (error) {
    console.error('Error synchronizing auth state:', error)
    return false
  }
}

/**
 * Validates the current authentication state and returns true if authenticated
 */
export async function isAuthenticated() {
  try {
    const { data } = await supabase.auth.getSession()
    return !!data?.session
  } catch (error) {
    console.error('Error checking authentication state:', error)
    return false
  }
} 