import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Only process auth for specific routes to improve performance
  const authRoutes = ['/my-calendars', '/saved-calendars', '/exams', '/auth']
  const shouldProcessAuth = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (shouldProcessAuth) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set({ name, value, ...options })
            })
          },
        },
      }
    )

    // Refresh session if needed (with timeout for performance)
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session check timeout')), 3000)
      )
      
      const sessionPromise = supabase.auth.getUser()
      
      await Promise.race([sessionPromise, timeoutPromise])
    } catch (error) {
      console.warn('Session refresh timeout or error:', error)
      // Continue without blocking the request
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes that don't need auth
     */
    '/((?!_next/static|_next/image|favicon.ico|api/(?!auth)).*)',
  ],
} 