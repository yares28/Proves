"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { syncAuthState as syncTokenState } from "@/lib/auth/token-manager"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Set session expiry to 30 days (in seconds)
      storage: {
        getItem: (key) => {
          if (typeof window === "undefined") return null;
          return window.localStorage.getItem(key);
        },
        setItem: (key, value) => {
          if (typeof window === "undefined") return;
          window.localStorage.setItem(key, value);
        },
        removeItem: (key) => {
          if (typeof window === "undefined") return;
          window.localStorage.removeItem(key);
        }
      }
    }
  }
)

type User = {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

interface AuthContextProps {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  signInWithProvider: (provider: "google" | "github" | "facebook") => Promise<void>
  syncToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user as User)
        
        // Store session in localStorage when auth state changes
        if (typeof window !== "undefined") {
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            currentSession: session
          }));
          console.log('Session updated in localStorage on auth state change');
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    // Initial session check
    checkSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setUser(session.user as User)
      
      // Ensure the session is properly stored in localStorage
      if (typeof window !== "undefined") {
        const storedToken = localStorage.getItem('supabase.auth.token');
        if (!storedToken || storedToken === 'true') {
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            currentSession: session
          }));
          console.log('Session properly stored in localStorage during checkSession');
        }
      }
    }
    setLoading(false)
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    
    if (!error && data.session) {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: data.session
      }));
      console.log('Session stored in localStorage after signup');
    }
    
    return { error }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (!error && data?.session) {
      console.log('Sign-in successful, persisting session');
      
      // Store the actual session object instead of just 'true'
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: data.session
      }));
      
      // Set consistent cookie format for server-side auth
      try {
        // Get the base URL without protocol
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/^https?:\/\//, '');
        const domain = window.location.hostname;
        
        // Set cookies that server can recognize
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; domain=${domain}; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; domain=${domain}; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        document.cookie = `sb:token=${data.session.access_token}; path=/; domain=${domain}; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        document.cookie = `sb-${baseUrl}-auth-token=${JSON.stringify(data.session)}; path=/; domain=${domain}; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        
        // Force a session refresh to ensure cookies are properly set
        await supabase.auth.refreshSession();
        
        console.log('Authentication cookies set successfully');
      } catch (e) {
        console.error('Error setting auth cookies:', e);
      }
      
      // Also update the user state
      setUser(data.session.user as User);
    }
    
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    // Clear manual storage items
    if (typeof window !== "undefined") {
      localStorage.removeItem('supabase.auth.token');
    }
    router.push("/")
  }

  async function signInWithProvider(provider: "google" | "github" | "facebook") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}`
      }
    })
  }

  // Add a utility function to synchronize auth state
  async function syncAuthState() {
    try {
      const { data } = await supabase.auth.getSession();
      
      if (data?.session) {
        // Ensure localStorage has the correct token format
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          currentSession: data.session
        }));
        
        // Update cookies as well
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/^https?:\/\//, '');
        const domain = window.location.hostname;
        
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; domain=${domain}; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; domain=${domain}; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        document.cookie = `sb:token=${data.session.access_token}; path=/; domain=${domain}; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        document.cookie = `sb-${baseUrl}-auth-token=${JSON.stringify(data.session)}; path=/; domain=${domain}; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error synchronizing auth state:", error);
      return false;
    }
  }

  // Function to manually sync token state before operations that need auth
  async function syncToken() {
    return await syncTokenState();
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithProvider,
    syncToken
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 