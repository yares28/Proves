import { NextRequest, NextResponse } from 'next/server'
// Use service role so this endpoint can be fetched by external
// calendar clients (e.g. Google Calendar) without user cookies
import { createAdminClient } from '@/lib/supabase/server'
import { getExams } from '@/actions/exam-actions'
import { generateICalContent } from '@/lib/utils'
import { validateICalContent } from '@/lib/ical-diagnostics'

// Enhanced headers for better calendar app compatibility
function getOptimalHeaders(filename: string) {
  return {
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}.ics"`,
    'Cache-Control': 'public, max-age=900', // Reduced to 15 minutes for better freshness
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'X-Content-Type-Options': 'nosniff',
    'Content-Transfer-Encoding': 'binary',
    'Pragma': 'no-cache', // Help prevent caching issues
  };
}

async function handleRequest(
  request: NextRequest,
  { params }: { params: { id: string } },
  method: 'GET' | 'HEAD'
) {
  try {
    const calendarId = params.id
    
    // Validate calendar ID format
    if (!calendarId || typeof calendarId !== 'string') {
      return new NextResponse('Invalid calendar ID', { status: 400 })
    }
    
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

    // Sanitize calendar name to prevent issues
    const sanitizedCalendarName = (calendar.name || 'UPV_Calendar')
      .replace(/[^\w\s-]/g, '')
      .trim() || 'UPV_Calendar';

    // For HEAD requests, we can return early with just headers
    if (method === 'HEAD') {
      return new NextResponse(null, {
        status: 200,
        headers: getOptimalHeaders(sanitizedCalendarName),
      })
    }
    
    // Validate and sanitize filters
    let filters = {}
    try {
      const rawFilters = calendar.filters || {}
      if (typeof rawFilters === 'object' && rawFilters !== null) {
        filters = rawFilters as Record<string, string[]>
      }
    } catch (e) {
      console.error('Error processing calendar filters:', e)
      filters = {}
    }
    
    // Fetch exams using the calendar's saved filters
    const filters = (calendar.filters || {}) as Record<string, string[]>
    const exams = await getExams(filters)
    
    // Validate exam data before processing
    if (!Array.isArray(exams)) {
      console.error('getExams returned non-array:', typeof exams)
      return new NextResponse('Invalid exam data', { status: 500 })
    }
    
    // Generate iCal content with error handling
    let icalContent: string
    try {
      icalContent = generateICalContent(exams, {
        calendarName: sanitizedCalendarName,
        timeZone: 'Europe/Madrid',
        reminderMinutes: [24 * 60, 60] // 1 day and 1 hour before
      })
    } catch (contentError) {
      console.error('Error generating iCal content:', contentError)
      
      // Generate minimal fallback content
      icalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//UPV Exam Calendar//EN',
        `X-WR-CALNAME:${sanitizedCalendarName} (Error)`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        'UID:error@upv-exam-calendar.com',
        'DTSTART:20240101T120000Z',
        'DTEND:20240101T130000Z',
        'SUMMARY:Calendar Generation Error',
        'DESCRIPTION:There was an error generating the calendar. Please try again later.',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n')
    }
    
    // Validate generated content
    const validation = validateICalContent(icalContent, {
      validateRFC5545: true,
      checkEncoding: true,
      validateTimezones: true,
      checkLineEndings: true
    })
    
    if (!validation.isValid) {
      console.error('Generated iCal content is invalid:', validation.errors)
      
      // Log validation issues but still serve content if it's not critically broken
      if (validation.errors.some(e => e.includes('Missing required property'))) {
        return new NextResponse('Calendar generation failed', { status: 500 })
      }
    }
    
    // Log warnings in development
    if (validation.warnings.length > 0 && process.env.NODE_ENV === 'development') {
      console.warn('iCal validation warnings:', validation.warnings)
    }
    
    // Return iCal content with optimal headers
    return new NextResponse(icalContent, {
      status: 200,
      headers: getOptimalHeaders(sanitizedCalendarName),
    })
  } catch (error) {
    console.error('Error in calendar iCal route:', error)
    
    // Return a more specific error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new NextResponse(`Calendar generation failed: ${errorMessage}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      }
    })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleRequest(request, { params }, 'GET')
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleRequest(request, { params }, 'HEAD')
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 