import { NextRequest, NextResponse } from 'next/server'
// Use service role so this endpoint can be fetched by external
// calendar clients (e.g. Google Calendar) without user cookies
import { createAdminClient } from '@/lib/supabase/server'
import { getExams } from '@/actions/exam-actions'
import { generateICalContent } from '@/lib/utils'

// Enhanced headers for better calendar app compatibility
function getOptimalHeaders(filename: string) {
  return {
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}.ics"`,
    'Cache-Control': 'no-cache, no-store, must-revalidate', // Prevent caching issues
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, User-Agent, Referer',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Type',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
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
    
    // Debug: Log the calendar data and filters being used
    console.log('🔍 [API DEBUG] Calendar data loaded:', {
      id: calendar.id,
      name: calendar.name,
      filters,
      filtersType: typeof filters,
      filtersKeys: Object.keys(filters || {}),
      createdAt: calendar.created_at
    });
    
    // Ensure filters are in the correct format for getExams
    let processedFilters = filters;
    if (typeof filters === 'object' && filters !== null) {
      // Ensure all filter values are arrays
      processedFilters = {};
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value && !Array.isArray(value)) {
          processedFilters[key] = [value];
        } else {
          processedFilters[key] = value;
        }
      });
      
      console.log('🔧 [API DEBUG] Processed filters:', processedFilters);
    }
    
    // Fetch exams using the calendar's saved filters
    console.log('🔄 [API] Calling getExams with filters:', processedFilters);
    const exams = await getExams(processedFilters, supabase)
    console.log('📊 [API] getExams returned:', exams?.length || 0, 'exams');
    
    // Debug: If no exams found, try fetching all exams to compare
    if (exams.length === 0) {
      console.log('⚠️ [API DEBUG] No exams found with filters, testing without filters...');
      try {
        const allExams = await getExams({}, supabase);
        console.log(`📊 [API DEBUG] Total exams in database: ${allExams.length}`);
        if (allExams.length > 0) {
          console.log('📋 [API DEBUG] Sample exam data:', allExams.slice(0, 3));
        }
      } catch (debugError) {
        console.error('❌ [API DEBUG] Error fetching all exams:', debugError);
      }
    }
    
    // Debug: Log sample exam dates
    if (exams.length > 0) {
      const sampleExams = exams.slice(0, 5).map(e => ({ subject: e.subject, date: e.date }));
      console.log('🔍 [API DEBUG] Sample exam dates:', sampleExams);
    }
    
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
    
    // Log content info for debugging
    console.log('📄 [API] Generated iCal content length:', icalContent.length);
    console.log('📄 [API] Content preview:', icalContent.substring(0, 200));
    
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