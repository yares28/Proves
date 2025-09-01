import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getExams } from '@/actions/exam-actions'
import { generateICalContent } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📅 [iCal API] Starting iCal generation for calendar:', params.id)
    console.log('📅 [iCal API] Request URL:', request.url)
    console.log('📅 [iCal API] Request headers:', Object.fromEntries(request.headers.entries()))
    
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('📅 [iCal API] Session check result:', {
      hasSession: !!session,
      sessionError: sessionError?.message,
      userId: session?.user?.id
    })
    
    if (sessionError || !session) {
      console.error('❌ [iCal API] Authentication error:', sessionError)
      return NextResponse.json(
        { error: 'Unauthorized', details: sessionError?.message || 'No session found' },
        { status: 401 }
      )
    }
    
    console.log('✅ [iCal API] User authenticated:', session.user.id)
    
    // Fetch the calendar from database
    const { data: calendar, error: calendarError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single()
    
    if (calendarError || !calendar) {
      console.error('❌ [iCal API] Calendar not found:', calendarError)
      return NextResponse.json(
        { error: 'Calendar not found' },
        { status: 404 }
      )
    }
    
    console.log('✅ [iCal API] Calendar found:', {
      id: calendar.id,
      name: calendar.name,
      filters: calendar.filters
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
