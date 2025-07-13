import { NextRequest, NextResponse } from 'next/server'
// Use service role so this endpoint can be fetched by external
// calendar clients (e.g. Google Calendar) without user cookies
import { createAdminClient } from '@/lib/supabase/server'
import { getExams } from '@/actions/exam-actions'
import { generateICalContent } from '@/lib/utils'


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const calendarId = params.id
    
    // Create Supabase client using service role to bypass RLS
    const supabase = await createAdminClient()
    
    // Fetch the saved calendar from Supabase
    const { data: calendar, error: calendarError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('id', calendarId)
      .single()
    
    if (calendarError || !calendar) {
      console.error('Calendar not found:', calendarError)
      return new NextResponse('Calendar not found', { status: 404 })
    }
    
    // Fetch exams using the calendar's saved filters
    const filters = (calendar.filters || {}) as Record<string, string[]>
    const exams = await getExams(filters)
    
    // Generate iCal content
    const icalContent = generateICalContent(exams, {
      calendarName: calendar.name,
      timeZone: 'Europe/Madrid',
      reminderMinutes: [24 * 60, 60] // 1 day and 1 hour before
    })
    
    // Return iCal content with proper headers
    return new NextResponse(icalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${calendar.name}.ics"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Error generating iCal:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Handle CORS preflight requests
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