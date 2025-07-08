/**
 * TokenManager - Simplified auth state management that works with SSR
 * This module now focuses on providing utility functions for auth state
 * while the main session management is handled by the auth context
 */

import { createClient } from '@/utils/supabase/client'
import type { Session } from '@supabase/supabase-js'

// Use the SSR-compatible client
const supabase = createClient()

/**
 * Refreshes and synchronizes token state
 * Call this before operations that require authentication
 */
export async function syncAuthState(): Promise<boolean> {
  console.log('🔄 Starting auth state synchronization...')
  
  try {
    // Get current session from Supabase
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Error getting session:', error.message)
      
      // If it's a refresh token error, try to refresh
      if (error.message.includes('refresh_token_not_found') || 
          error.message.includes('Invalid Refresh Token')) {
        console.log('🔄 Attempting to refresh session...')
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          console.error('❌ Session refresh failed:', refreshError.message)
          return false
        }
        
        if (refreshData?.session) {
          console.log('✅ Session refreshed successfully')
          return true
        }
      }
      
      return false
    }
    
    if (!data?.session) {
      console.warn('⚠️ No active session found during sync')
      return false
    }
    
    console.log('✅ Valid session found', { 
      userId: data.session.user.id,
      email: data.session.user.email,
      expiresAt: new Date(data.session.expires_at! * 1000).toISOString()
    })
    
    console.log('✅ Auth state synchronization complete')
    return true
  } catch (error) {
    console.error('❌ Error syncing auth state:', error)
    return false
  }
}

/**
 * Checks if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  console.log('🔍 Checking authentication status...')
  
  try {
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Error checking authentication:', error.message)
      return false
    }
    
    const authenticated = !!data?.session
    
    if (authenticated) {
      console.log('✅ User is authenticated', {
        userId: data.session?.user.id,
        expiresIn: data.session ? Math.floor((data.session.expires_at! * 1000 - Date.now()) / 1000) + ' seconds' : 'N/A'
      })
    } else {
      console.log('❌ User is not authenticated')
    }
    
    return authenticated
  } catch (error) {
    console.error('❌ Error checking authentication:', error)
    return false
  }
}

/**
 * Gets the current session
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Error getting current session:', error.message)
      return null
    }
    
    return session
  } catch (error) {
    console.error('❌ Error getting current session:', error)
    return null
  }
}

/**
 * Gets the current user
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('❌ Error getting current user:', error.message)
      return null
    }
    
    return user
  } catch (error) {
    console.error('❌ Error getting current user:', error)
    return null
  }
}

/**
 * Force refresh the current session
 */
export async function refreshSession(): Promise<boolean> {
  try {
    console.log('🔄 Force refreshing session...')
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('❌ Session refresh failed:', error.message)
      return false
    }
    
    if (data?.session) {
      console.log('✅ Session refreshed successfully')
      return true
    }
    
    return false
  } catch (error) {
    console.error('❌ Error refreshing session:', error)
    return false
  }
} 