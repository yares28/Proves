import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')
  
  // Get the 'next' parameter for post-auth redirect, default to '/my-calendars'
  let next = searchParams.get('next') ?? '/my-calendars'
  if (!next.startsWith('/')) {
    next = '/my-calendars'
  }

  // Handle OAuth errors immediately
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error)}`)
  }

  // Handle Google Calendar OAuth (bypass Supabase auth)
  if (state && state.includes('google-calendar')) {
    console.log('Google Calendar OAuth callback detected, redirecting to client handler')
    return NextResponse.redirect(`${origin}/auth/callback/page?code=${code}&state=${state}`)
  }

  // Handle missing authorization code for Supabase auth
  if (!code) {
    console.error('No authorization code received')
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=missing_code`)
  }

  // Process Supabase authentication with optimizations
  const supabase = createClient(cookies())

  try {
    console.log('🔄 Processing Supabase auth callback...')
    
    // Set a timeout for the exchange operation
    const exchangePromise = supabase.auth.exchangeCodeForSession(code)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 10000) // 10 second timeout
    )
    
    const { error: exchangeError } = await Promise.race([exchangePromise, timeoutPromise]) as any
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(exchangeError.message)}`)
    }

    console.log('✅ Successfully exchanged code for session')
    
    // Handle different environments for proper redirection
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    
    // Build redirect URL with success indicator
    const redirectUrl = `${next}?auth=success`
    
    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${redirectUrl}`)
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${redirectUrl}`)
    } else {
      return NextResponse.redirect(`${origin}${redirectUrl}`)
    }
  } catch (error: any) {
    console.error('Unexpected error in auth callback:', error)
    
    // Handle timeout specifically
    if (error.message === 'timeout') {
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=timeout`)
    }
    
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=unexpected_error`)
  }
} 