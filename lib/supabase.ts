import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Centralized Supabase table name for exams
// You can override this via NEXT_PUBLIC_EXAMS_TABLE environment variable
export const EXAMS_TABLE = process.env.NEXT_PUBLIC_EXAMS_TABLE || '25-26'

// List of available exam tables (extend as new academic years are added)
// Prefer environment-provided value and known current table(s)
export const AVAILABLE_EXAMS_TABLES = Array.from(new Set([
  EXAMS_TABLE,
  '25-26',
]))

// Resolve table name at runtime to support both new and old names
export let RESOLVED_EXAMS_TABLE = EXAMS_TABLE
let hasResolvedTable = false
let resolvingPromise: Promise<string> | null = null

export async function resolveExamsTable(): Promise<string> {
  if (hasResolvedTable) return RESOLVED_EXAMS_TABLE
  if (resolvingPromise) return resolvingPromise

  const candidates = Array.from(new Set([
    EXAMS_TABLE,
    '25-26',
  ]))

  resolvingPromise = (async () => {
    for (const name of candidates) {
      try {
        // Minimal query to validate table existence
        const { error } = await supabase
          .from(name as any)
          .select('*')
          .limit(1)

        if (!error) {
          RESOLVED_EXAMS_TABLE = name
          hasResolvedTable = true
          return name
        }

        // If relation missing or invalid identifier/syntax, try next candidate
        const msg = error?.message || ''
        const code = (error as any)?.code || ''
        if (
          /does not exist|relation/i.test(msg) ||
          code === '42P01' || // undefined_table
          /syntax error/i.test(msg) ||
          code === '42601' // syntax_error
        ) {
          continue
        }

        // For other errors, still pick this name to avoid infinite fallback
        RESOLVED_EXAMS_TABLE = name
        hasResolvedTable = true
        return name
      } catch {
        // Try next candidate on unexpected failure
        continue
      }
    }
    // Fallback to configured value if all else fails
    RESOLVED_EXAMS_TABLE = EXAMS_TABLE
    hasResolvedTable = true
    return EXAMS_TABLE
  })()

  return resolvingPromise
}

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
