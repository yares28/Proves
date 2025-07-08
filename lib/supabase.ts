import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Keep your refresh token around (localStorage by default in the browser)
    persistSession: true,
    // When access tokens expire, automatically refresh them
    autoRefreshToken: true,
    // (optional) detect auth state in URL hash after a redirect sign-in
    detectSessionInUrl: true,
    // Store session data in localStorage for better persistence
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
})
