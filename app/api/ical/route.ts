import { NextRequest, NextResponse } from 'next/server'
import { getExams } from '@/actions/exam-actions'
import { generateICalContent } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'

// Enhanced headers for better calendar app compatibility
function getOptimalHeaders(filename: string, contentLength?: number) {
  return {
    'Content-Type': 'text/calendar; charset=utf-8',
    ...(contentLength ? { 'Content-Length': String(contentLength) } : {}),
  };
}

async function handleRequest(request: NextRequest, method: 'GET' | 'HEAD') {
  try {
    // This endpoint is designed for public access by calendar applications
    // It doesn't require authentication since it uses filters from URL parameters
    const { searchParams } = new URL(request.url)
    const filtersParam = searchParams.get('filters')
    const calendarName = searchParams.get('name') || 'UPV Exams'
    
    // Sanitize calendar name to prevent issues
    const sanitizedCalendarName = calendarName.replace(/[^\w\s-]/g, '').trim() || 'UPV_Exams';
    
    // For HEAD requests, we can return early with just headers
    if (method === 'HEAD') {
      // Generate a minimal valid VCALENDAR for length calculation
      const minimalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//UPV Exam Calendar//EN',
        `X-WR-CALNAME:${sanitizedCalendarName}`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:head-request@upv-exam-calendar.com`,
        'DTSTART:20250101T000000Z',
        'DTEND:20250101T010000Z',
        'SUMMARY:No Exams Found',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');
      return new NextResponse(null, {
        status: 200,
        headers: getOptimalHeaders(
          sanitizedCalendarName,
          Buffer.byteLength(minimalContent, 'utf8')
        ),
      })
    }
    
    // Parse filters from URL parameter with better error handling
    let filters = {}
    if (filtersParam) {
      try {
        const decodedFilters = decodeURIComponent(filtersParam)
        filters = JSON.parse(decodedFilters)
        
        // Validate filters object
        if (typeof filters !== 'object' || filters === null) {
          console.warn('Invalid filters format, using empty filters')
          filters = {}
        }
      } catch (e) {
        console.error('Error parsing filters:', e)
        filters = {}
      }
    }
    
    // Use service role client so anonymous calendar apps can read data
    const supabase = await createAdminClient()

    // Fetch exams using the provided filters
    console.log('🔍 [API] Calling getExams with filters:', filters);
    const exams = await getExams(filters, supabase)
    console.log('📊 [API] getExams returned:', exams?.length || 0, 'exams');
    
    // Guarantee at least one valid VEVENT if no exams found
    if (exams.length === 0) {
      return new NextResponse(
        [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//UPV Exam Calendar//EN',
          `X-WR-CALNAME:${sanitizedCalendarName}`,
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH',
          'BEGIN:VEVENT',
          `UID:no-exams-${Date.now()}@upv-exam-calendar.com`,
          'DTSTART:20250101T000000Z',
          'DTEND:20250101T010000Z',
          'SUMMARY:No Exams Found',
          'END:VEVENT',
          'END:VCALENDAR',
        ].join('\r\n'),
        { status: 200, headers: getOptimalHeaders(sanitizedCalendarName, Buffer.byteLength([
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//UPV Exam Calendar//EN',
          `X-WR-CALNAME:${sanitizedCalendarName}`,
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH',
          'BEGIN:VEVENT',
          `UID:no-exams-${Date.now()}@upv-exam-calendar.com`,
          'DTSTART:20250101T000000Z',
          'DTEND:20250101T010000Z',
          'SUMMARY:No Exams Found',
          'END:VEVENT',
          'END:VCALENDAR',
        ].join('\r\n'), 'utf8')) }
      );
    }
    
    // Validate exam data before processing
    if (!Array.isArray(exams)) {
      console.error('getExams returned non-array:', typeof exams)
      return new NextResponse('Invalid exam data', { status: 500 })
    }
    
    if (exams.length === 0) {
      console.warn('⚠️ [API] No exams returned from getExams');
    } else {
      console.log('✅ [API] Sample exam:', exams[0]);
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
    
    // Return iCal content with optimal headers, including Content-Length
    return new NextResponse(icalContent, {
      status: 200,
      headers: getOptimalHeaders(
        sanitizedCalendarName,
        Buffer.byteLength(icalContent, 'utf8')
      ),
    })
  } catch (error) {
    console.error('Error in iCal route:', error)
    
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

export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET')
}

export async function HEAD(request: NextRequest) {
  return handleRequest(request, 'HEAD')
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