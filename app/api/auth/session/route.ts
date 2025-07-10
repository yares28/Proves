import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token, expires_at } = await request.json()

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: 'Missing tokens' }, { status: 400 })
    }

    const response = NextResponse.json({ success: true })
    
    // Set httpOnly cookies for secure token storage
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    }

    response.cookies.set('sb-access-token', access_token, cookieOptions)
    response.cookies.set('sb-refresh-token', refresh_token, cookieOptions)
    
    if (expires_at) {
      response.cookies.set('sb-expires-at', expires_at.toString(), cookieOptions)
    }

    return response
  } catch (error) {
    console.error('Error storing session:', error)
    return NextResponse.json({ error: 'Failed to store session' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value
    const refreshToken = cookieStore.get('sb-refresh-token')?.value
    const expiresAt = cookieStore.get('sb-expires-at')?.value

    if (!accessToken || !refreshToken) {
      return NextResponse.json({ session: null })
    }

    return NextResponse.json({
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt ? parseInt(expiresAt) : null
      }
    })
  } catch (error) {
    console.error('Error retrieving session:', error)
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 })
  }
} 