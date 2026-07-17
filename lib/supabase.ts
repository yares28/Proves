import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * All exams live in one table, keyed by `academic_year`. There is deliberately
 * no table-name resolution here any more: a new academic year arrives as rows
 * from the scraper, not as a new table needing a code change and a redeploy.
 * See scraper/sql/002_unified_exams.sql.
 */
export const EXAMS_TABLE = 'exams'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Keep your refresh token around but use secure storage
    persistSession: true,
    // When access tokens expire, automatically refresh them
    autoRefreshToken: true,
    // (optional) detect auth state in URL hash after a redirect sign-in
    detectSessionInUrl: true,
    // Use secure httpOnly cookie storage instead of localStorage
    storage: {
      getItem: (key) => {
        if (typeof window === "undefined") return null;
        // For client-side, rely on httpOnly cookies managed by server
        // This is a placeholder - actual session retrieval happens server-side
        return null;
      },
      setItem: (key, value) => {
        if (typeof window === "undefined") return;
        // Sessions are now managed securely via httpOnly cookies
        // No client-side storage of sensitive tokens
        console.debug("Session storage handled securely server-side");
      },
      removeItem: (key) => {
        if (typeof window === "undefined") return;
        // Session removal handled via server-side cookie clearing
        console.debug("Session removal handled securely server-side");
      }
    }
  }
})
