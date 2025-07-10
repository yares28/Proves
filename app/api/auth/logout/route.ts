import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({ success: true })
    
    // Clear all authentication cookies securely
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0 // Expire immediately
    }

    response.cookies.set('sb-access-token', '', cookieOptions)
    response.cookies.set('sb-refresh-token', '', cookieOptions)
    response.cookies.set('sb-expires-at', '', cookieOptions)

    return response
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
  }
} 