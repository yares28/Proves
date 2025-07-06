import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API] Testing server-side authentication...')
    
    // Create server-side Supabase client
    const supabase = await createClient()
    
    // Try to get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ [API] Error getting user:', userError.message)
      return NextResponse.json({
        success: false,
        message: 'Server authentication failed',
        error: userError.message,
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }
    
    if (!user) {
      console.log('⚠️ [API] No authenticated user found')
      return NextResponse.json({
        success: false,
        message: 'No authenticated user found on server',
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }
    
    console.log('✅ [API] Server authentication successful for user:', user.id)
    
    return NextResponse.json({
      success: true,
      message: 'Server authentication successful',
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        last_sign_in_at: user.last_sign_in_at,
        created_at: user.created_at
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ [API] Server auth test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Server error during authentication test',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 