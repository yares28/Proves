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
    
    // Get the access token from URL parameters (for webcal compatibility)
    const accessToken = request.nextUrl.searchParams.get('access_token')
    
    console.log('📅 [iCal API] Auth check:', {
      hasAccessToken: !!accessToken,
      tokenLength: accessToken?.length || 0
    })
    
    if (!accessToken) {
      console.error('❌ [iCal API] No access token provided')
      return NextResponse.json(
        { error: 'Access token required. Please include access_token in the URL parameters.' },
        { status: 401 }
      )
    }
    
    // Create Supabase client with service key for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [iCal API] Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify the access token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken)
    
    if (userError || !user) {
      console.error('❌ [iCal API] Invalid access token:', userError)
      return NextResponse.json(
        { error: 'Invalid or expired access token' },
        { status: 401 }
      )
    }
    
    console.log('✅ [iCal API] User authenticated:', user.id)
    
    // Fetch the calendar from database and ensure it belongs to the authenticated user
    const { data: calendar, error: calendarError } = await supabaseAdmin
      .from('user_calendars')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()
    
    if (calendarError || !calendar) {
      console.error('❌ [iCal API] Calendar not found:', calendarError)
      return NextResponse.json(
        { error: 'Calendar not found or access denied' },
        { status: 404 }
      )
    }
    
    console.log('✅ [iCal API] Calendar found:', {
      id: calendar.id,
      name: calendar.name,
      filters: calendar.filters,
      ownerId: calendar.user_id,
      requesterId: user.id
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
