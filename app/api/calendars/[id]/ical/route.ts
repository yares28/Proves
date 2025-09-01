import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getExams } from '@/actions/exam-actions'
import { generateICalContent } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📅 [iCal API] Starting iCal generation for calendar:', params.id)
    console.log('📅 [iCal API] Request URL:', request.url)
    
    // Get token from URL parameters (required for webcal protocol compatibility)
    const token = request.nextUrl.searchParams.get('token')
    
    if (!token) {
      console.error('❌ [iCal API] No token provided')
      return NextResponse.json(
        { error: 'Token required for calendar access' },
        { status: 401 }
      )
    }
    
    // Create admin Supabase client for secure token verification
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [iCal API] Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('✅ [iCal API] Verifying calendar access with token')
    
    // Verify token by decoding and checking calendar access
    // Token format: base64(calendar_id:user_id:timestamp)
    let calendarId, userId, timestamp;
    try {
      // Safely decode base64 token
      let decoded;
      try {
        decoded = Buffer.from(token, 'base64').toString('utf-8')
      } catch (base64Error) {
        throw new Error('Invalid base64 token')
      }
      
      const parts = decoded.split(':')
      if (parts.length !== 3) {
        throw new Error('Invalid token format')
      }
      [calendarId, userId, timestamp] = parts
      
      // Validate parts
      if (!calendarId || !userId || !timestamp) {
        throw new Error('Missing token components')
      }
      
      // Verify calendar ID matches
      if (calendarId !== params.id) {
        throw new Error('Token calendar ID mismatch')
      }
      
      // Validate timestamp is a number
      const timestampNum = parseInt(timestamp)
      if (isNaN(timestampNum)) {
        throw new Error('Invalid timestamp in token')
      }
      
      // Check if token is not too old (7 days expiry)
      const tokenAge = Date.now() - timestampNum
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
      if (tokenAge > maxAge) {
        throw new Error('Token expired')
      }
      
      console.log('✅ [iCal API] Token verified successfully')
      
    } catch (tokenError) {
      console.error('❌ [iCal API] Token validation failed:', tokenError)
      return NextResponse.json(
        { error: 'Invalid or expired access token', details: tokenError.message },
        { status: 401 }
      )
    }
    
    // Fetch the calendar from database and verify ownership
    const { data: calendar, error: calendarError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single()
    
    if (calendarError || !calendar) {
      console.error('❌ [iCal API] Calendar not found:', calendarError)
      return NextResponse.json(
        { error: 'Calendar not found or access denied' },
        { status: 404 }
      )
    }
    
    console.log('✅ [iCal API] Calendar found and access verified:', {
      id: calendar.id,
      name: calendar.name,
      filters: calendar.filters,
      userId: calendar.user_id
    })
    
    // Get the exams based on the calendar's filters
    console.log('🔍 [iCal API] Calling getExams with filters:', calendar.filters)
    let exams;
    try {
      exams = await getExams(calendar.filters as Record<string, string[]>)
    } catch (examError) {
      console.error('❌ [iCal API] Error fetching exams:', examError)
      return NextResponse.json(
        { error: 'Error fetching exam data', details: examError instanceof Error ? examError.message : 'Unknown error' },
        { status: 500 }
      )
    }
    
    console.log('📊 [iCal API] Exams fetched:', {
      count: exams.length,
      filters: calendar.filters
    })
    
    // Generate iCal content
    let icalContent;
    try {
      icalContent = generateICalContent(exams, {
        calendarName: calendar.name,
        useUPVFormat: true,
        timeZone: 'Europe/Madrid'
      })
    } catch (icalError) {
      console.error('❌ [iCal API] Error generating iCal content:', icalError)
      return NextResponse.json(
        { error: 'Error generating calendar content', details: icalError instanceof Error ? icalError.message : 'Unknown error' },
        { status: 500 }
      )
    }
    
    console.log('📄 [iCal API] iCal content generated successfully, length:', icalContent.length)
    
    // Return iCal file with proper headers
    return new NextResponse(icalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${calendar.name.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
    
  } catch (error) {
    console.error('❌ [iCal API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
