"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

// Use the SSR-compatible client
const supabase = createClient()

interface AuthContextProps {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  signInWithProvider: (provider: "google") => Promise<void>
  syncToken: () => Promise<boolean>
  refreshSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Enhanced session refresh with exponential backoff
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 Refreshing auth session...')
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('❌ Session refresh failed:', error.message)
        return false
      }
      
      if (session?.user) {
        console.log('✅ Session refresh successful')
        setUser(session.user)
        return true
      }
      
      return false
    } catch (error) {
      console.error('❌ Unexpected refresh error:', error)
      return false
    }
  }, [])

  // Schedule automatic token refresh
  const scheduleTokenRefresh = useCallback((expiresAt: number) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
    
    // Refresh 5 minutes before expiration
    const refreshTime = (expiresAt * 1000) - Date.now() - (5 * 60 * 1000)
    
    if (refreshTime > 0) {
      refreshTimeoutRef.current = setTimeout(async () => {
        console.log('⏰ Auto-refreshing session...')
        await refreshSession()
      }, refreshTime)
    }
  }, [refreshSession])

  // Clear authentication data
  const clearAuthData = useCallback(async () => {
    try {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }
      
      // Clear localStorage data
      if (typeof window !== "undefined") {
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('oauth_provider_token')
        localStorage.removeItem('oauth_provider_refresh_token')
      }
    } catch (error) {
      console.error('❌ Error clearing auth data:', error)
    }
  }, [])

  const signInWithProvider = useCallback(async (provider: "google") => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // Use PKCE flow with our application's callback route
          redirectTo: `${window.location.origin}/auth/callback`,
          // Add proper Google scopes for better compatibility
          scopes: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
          // Request refresh token for Google
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('❌ Provider sign-in error:', error)
        throw error
      }

      // For PKCE flow, signInWithOAuth returns a URL to redirect to
      if (data?.url) {
        console.log('🔄 Redirecting to provider...')
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('❌ Sign-in with provider failed:', error)
      throw error
    }
  }, [supabase.auth])

  useEffect(() => {
    let mounted = true
    console.log('🔄 Setting up auth state listener')

    // Enhanced auth state listener with provider token handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event)
      
      if (!mounted) return

      if (event === 'SIGNED_IN' && session) {
        setUser(session.user)
        
        // Handle OAuth provider tokens
        if (session.provider_token) {
          console.log('✅ Provider token received, storing...')
          localStorage.setItem('oauth_provider_token', session.provider_token)
        }
        
        if (session.provider_refresh_token) {
          localStorage.setItem('oauth_provider_refresh_token', session.provider_refresh_token)
        }
        
        // Schedule automatic refresh
        if (session.expires_at) {
          scheduleTokenRefresh(session.expires_at)
        }
        
        console.log('✅ User signed in:', session.user.email)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        
        // Clear stored provider tokens
        localStorage.removeItem('oauth_provider_token')
        localStorage.removeItem('oauth_provider_refresh_token')
        
        // Clear refresh timeout
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current)
          refreshTimeoutRef.current = null
        }
        
        console.log('✅ User signed out')
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setUser(session.user)
        console.log('✅ Token refreshed')
        
        // Update stored provider tokens if refreshed
        if (session.provider_token) {
          localStorage.setItem('oauth_provider_token', session.provider_token)
        }
        
        if (session.provider_refresh_token) {
          localStorage.setItem('oauth_provider_refresh_token', session.provider_refresh_token)
        }
      }
      
      setLoading(false)
    })

    // Initial session check with retry logic
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Error getting initial session:', error.message)
          
          // If it's a refresh token error, try to recover
          if (error.message.includes('refresh_token_not_found') || 
              error.message.includes('Invalid Refresh Token')) {
            console.log('🔄 Attempting session recovery...')
            const recovered = await refreshSession()
            if (!recovered) {
              await clearAuthData()
              setUser(null)
            }
          } else {
            setUser(null)
          }
        } else if (session?.user) {
          setUser(session.user)
          // Schedule automatic refresh for existing session
          if (session.expires_at) {
            scheduleTokenRefresh(session.expires_at)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('❌ Unexpected error during auth initialization:', error)
        setUser(null)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
      // Clear timeout on cleanup
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [supabase.auth, refreshSession, clearAuthData, scheduleTokenRefresh])

  // Cross-tab session synchronization
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('sb-') && e.newValue !== e.oldValue) {
        console.log('🔄 Auth state changed in another tab, syncing...')
        // Trigger a session check when auth changes in another tab
        supabase.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user ?? null)
        })
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  async function signUp(email: string, password: string, fullName: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      
      return { error }
    } catch (error) {
      console.error('❌ Signup error:', error)
      return { error }
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.error('❌ Sign in error:', error.message)
        return { error }
      }
      
      console.log('✅ Sign in successful')
      return { error: null }
    } catch (error) {
      console.error('❌ Unexpected sign in error:', error)
      return { error }
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ Sign out error:', error.message)
      }
      
      await clearAuthData()
      router.push("/")
    } catch (error) {
      console.error('❌ Unexpected sign out error:', error)
    }
  }

  // Simplified sync token function
  async function syncToken(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Token sync error:', error.message)
        
        // Try to recover from refresh token errors
        if (error.message.includes('refresh_token_not_found') || 
            error.message.includes('Invalid Refresh Token')) {
          return await refreshSession()
        }
        return false
      }
      
      return !!session
    } catch (error) {
      console.error('❌ Unexpected token sync error:', error)
      return false
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithProvider,
    syncToken,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 