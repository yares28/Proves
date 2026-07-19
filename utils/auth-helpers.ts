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

    if (error || !session) {
      return null
    }

    // Refresh proactively if the token is expired or expires within 5 minutes.
    const expiresAt = session.expires_at! * 1000 // Convert to milliseconds
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000)

    if (expiresAt <= fiveMinutesFromNow) {
      const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError || !refreshedSession?.session) {
        return null
      }

      return refreshedSession.session
    }

    return session
  } catch {
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
  } catch {
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
      return null
    }

    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token
    }
  } catch {
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