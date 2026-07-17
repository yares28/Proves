"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

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
  const { toast } = useToast()

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
      console.log('🔄 Clearing authentication data...')
      
      // Clear refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }
      
      // Clear localStorage data
      if (typeof window !== "undefined") {
        try {
          // Clear all Supabase-related localStorage items
          const keysToRemove = [
            'supabase.auth.token',
            'oauth_provider_token',
            'oauth_provider_refresh_token',
            'sb-access-token',
            'sb-refresh-token',
            'sb-expires-at'
          ]
          
          keysToRemove.forEach(key => {
            try {
              localStorage.removeItem(key)
            } catch (e) {
              // Ignore individual localStorage errors
            }
          })
          
          // Also clear any other Supabase-related keys
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') || key.includes('supabase')) {
              try {
                localStorage.removeItem(key)
              } catch (e) {
                // Ignore individual localStorage errors
              }
            }
          })
          
          console.log('✅ Local storage cleared')
        } catch (localStorageError) {
          console.warn('⚠️ Failed to clear localStorage:', localStorageError)
        }
      }
      
      console.log('✅ Authentication data cleared successfully')
    } catch (error) {
      console.error('❌ Error clearing auth data:', error)
    }
  }, [])

  const signInWithProvider = useCallback(async (provider: "google") => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // Add proper Google scopes for better compatibility
          scopes: 'openid email profile',
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

      console.log('✅ OAuth sign-in initiated successfully')
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

        // Schedule automatic refresh
        if (session.expires_at) {
          scheduleTokenRefresh(session.expires_at)
        }

        console.log('✅ User signed in')
      } else if (event === 'SIGNED_OUT') {
        console.log('🔄 User signed out event received')
        setUser(null)
        
        // Clear stored provider tokens
        try {
          localStorage.removeItem('oauth_provider_token')
          localStorage.removeItem('oauth_provider_refresh_token')
        } catch (error) {
          console.warn('⚠️ Failed to clear localStorage:', error)
        }
        
        // Clear refresh timeout
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current)
          refreshTimeoutRef.current = null
        }
        
        console.log('✅ User signed out')
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setUser(session.user)
        console.log('✅ Token refreshed')
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
      console.log('🔄 Signing out user...')
      
      // First, try to sign out from Supabase (this might fail if no session exists)
      try {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.warn('⚠️ Supabase sign out warning:', error.message)
          // Don't throw here, continue with local cleanup
        }
      } catch (supabaseError) {
        console.warn('⚠️ Supabase sign out failed, continuing with local cleanup:', supabaseError)
      }
      
      // Clear local auth data
      await clearAuthData()
      
      // Clear server-side session via API
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        })
        console.log('✅ Server-side session cleared')
      } catch (apiError) {
        console.warn('⚠️ Failed to clear server-side session:', apiError)
        // Continue anyway, local cleanup is more important
      }
      
      // Update local state
      setUser(null)
      
      // Show success message
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente.",
      })
      
      // Redirect to home page
      router.push("/")
      
      console.log('✅ Sign out completed successfully')
    } catch (error) {
      console.error('❌ Unexpected sign out error:', error)
      
      // Show error message to user
      toast({
        title: "Error al cerrar sesión",
        description: "Ocurrió un error inesperado, pero se ha limpiado la sesión local.",
        variant: "destructive",
      })
      
      // Even if there's an error, try to clear local state and redirect
      setUser(null)
      router.push("/")
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