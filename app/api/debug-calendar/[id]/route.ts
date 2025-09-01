import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 [Debug] Calendar ID:', params.id)
    console.log('🔍 [Debug] Request URL:', request.url)
    
    const token = request.nextUrl.searchParams.get('token')
    console.log('🔍 [Debug] Token present:', !!token)
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('🔍 [Debug] Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      nodeEnv: process.env.NODE_ENV
    })
    
    // Try to decode token
    let decodedToken = null
    if (token) {
      try {
        decodedToken = Buffer.from(token, 'base64').toString('utf-8')
        console.log('🔍 [Debug] Decoded token:', decodedToken)
      } catch (e) {
        console.error('🔍 [Debug] Token decode error:', e)
      }
    }
    
    return NextResponse.json({
      success: true,
      calendarId: params.id,
      hasToken: !!token,
      decodedToken,
      environment: {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        nodeEnv: process.env.NODE_ENV
      }
    })
    
  } catch (error) {
    console.error('🔍 [Debug] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
