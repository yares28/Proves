import { createClient } from '@/utils/supabase/client'
import type { Session } from '@supabase/supabase-js'

const supabase = createClient()

/**
 * Gets the current session and ensures tokens are fresh
 * Automatically refreshes tokens if they're close to expiring
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Error getting session:', error.message)
      return null
    }
    
    if (!session) {
      console.log('⚠️ No session found')
      return null
    }
    
    // Check if token is expired or will expire in the next 5 minutes
    const expiresAt = session.expires_at! * 1000 // Convert to milliseconds
    const now = Date.now()
    const fiveMinutesFromNow = now + (5 * 60 * 1000)
    
    if (expiresAt <= fiveMinutesFromNow) {
      console.log('🔄 Token is expired or expiring soon, refreshing...')
      
      const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('❌ Token refresh failed:', refreshError.message)
        return null
      }
      
      if (refreshedSession?.session) {
        console.log('✅ Token refreshed successfully')
        return refreshedSession.session
      }
      
      console.error('❌ No session after refresh')
      return null
    }
    
    console.log('✅ Using existing valid session')
    return session
  } catch (error) {
    console.error('❌ Error in getCurrentSession:', error)
    return null
  }
}

/**
 * Synchronizes the authentication state - simplified version
 */
export async function syncAuthState(): Promise<boolean> {
  try {
    const session = await getCurrentSession()
    return !!session
  } catch (error) {
    console.error('❌ Error synchronizing auth state:', error)
    return false
  }
}

/**
 * Gets fresh auth tokens for server actions
 * Ensures tokens are valid and refreshed if needed
 */
export async function getFreshAuthTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const session = await getCurrentSession()
    
    if (!session?.access_token || !session?.refresh_token) {
      console.log('❌ No valid tokens available')
      return null
    }
    
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token
    }
  } catch (error) {
    console.error('❌ Error getting fresh auth tokens:', error)
    return null
  }
}

/**
 * Checks if the user is authenticated with fresh tokens
 */
export async function isAuthenticatedWithFreshTokens(): Promise<boolean> {
  const session = await getCurrentSession()
  return !!session?.access_token
} 