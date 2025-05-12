import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check if the route is protected (currently only /my-calendars is protected)
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/my-calendars')

  // If accessing a protected route and not signed in, redirect to home page
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/', req.url)
    // Add a query parameter to indicate auth is required
    redirectUrl.searchParams.set('auth_required', 'true')
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ['/my-calendars/:path*'],
} 