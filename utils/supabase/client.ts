
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Keep your refresh token around (localStorage by default in the browser)
        persistSession: true,
        // When access tokens expire, automatically refresh them
        autoRefreshToken: true,
        // (optional) detect auth state in URL hash after a redirect sign-in
        detectSessionInUrl: true,
      }
    }
  );
