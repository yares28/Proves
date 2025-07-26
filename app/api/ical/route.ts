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
    
    console.log(`🌐 [ICAL-API] ${method} request to iCal endpoint`);
    console.log(`🔍 [ICAL-API] Full URL: ${request.url}`);
    console.log(`📝 [ICAL-API] Calendar name: ${calendarName}`);
    console.log(`🔧 [ICAL-API] Filters param: ${filtersParam}`);
    console.log(`📊 [ICAL-API] All search params:`, Object.fromEntries(searchParams.entries()));
    
    // Sanitize calendar name to prevent issues but allow more characters for Spanish
    const sanitizedCalendarName = calendarName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim() || 'UPV_Exams';
    
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
    
    // Parse filters from URL parameters with better error handling
    let filters: Record<string, any> = {}
    
    // First try to parse JSON filters parameter (for backward compatibility)
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
    } else {
      // Parse individual filter parameters (better for Google Calendar compatibility)
      const schools = searchParams.getAll('school')
      const degrees = searchParams.getAll('degree')
      const years = searchParams.getAll('year')
      const semesters = searchParams.getAll('semester')
      const subjects = searchParams.getAll('subject')
      
      if (schools.length > 0) filters.school = schools
      if (degrees.length > 0) filters.degree = degrees
      if (years.length > 0) filters.year = years
      if (semesters.length > 0) filters.semester = semesters
      if (subjects.length > 0) filters.subject = subjects
      
      console.log(`🔧 [ICAL-API] Parsed individual parameters:`, {
        schools: schools.length,
        degrees: degrees.length, 
        years: years.length,
        semesters: semesters.length,
        subjects: subjects.length
      });
    }
    
    console.log(`✅ [ICAL-API] Final filters object:`, filters);
    console.log(`📏 [ICAL-API] Number of filter categories:`, Object.keys(filters).length);
    console.log(`🔍 [ICAL-API] Filter analysis:`, {
      hasSchools: (filters.school?.length || 0) > 0,
      hasDegrees: (filters.degree?.length || 0) > 0,
      hasYears: (filters.year?.length || 0) > 0,
      hasSemesters: (filters.semester?.length || 0) > 0,
      hasSubjects: (filters.subject?.length || 0) > 0,
      hasAnyFilters: Object.values(filters).some(arr => Array.isArray(arr) && arr.length > 0),
      isEmpty: Object.keys(filters).length === 0
    });
    
    // Use service role client so anonymous calendar apps can read data
    const supabase = await createAdminClient()

    // Fetch exams using the provided filters
    console.log('🔍 [API] Calling getExams with filters:', filters);
    const exams = await getExams(filters, supabase)
    console.log('📊 [API] getExams returned:', exams?.length || 0, 'exams');
    
    // Guarantee at least one valid VEVENT if no exams found - use UPV format
    if (exams.length === 0) {
      console.warn(`⚠️ [ICAL-API] No exams found for filters:`, filters);
      console.log(`🔍 [ICAL-API] Generating "No Exams Found" calendar event`);
      
      const now = new Date();
      const nowUtc = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
      const endUtc = new Date(now.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
      
      // Create a more informative description about the filters used
      const filterDesc = Object.keys(filters).length > 0 
        ? `Filters applied: ${Object.entries(filters).map(([key, values]) => `${key}=(${Array.isArray(values) ? values.join(',') : values})`).join('; ')}`
        : 'No filters applied - showing all available exams';
      
      const emptyContent = [
        'BEGIN:VCALENDAR',
        'PRODID:-//UPV-Cal//Exam API 1.0//ES',
        'VERSION:2.0',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${sanitizedCalendarName} (No Exams)`,
        'X-APPLE-CALENDAR-COLOR:#FF6B35',
        'X-WR-TIMEZONE:Europe/Madrid',
        'BEGIN:VEVENT',
        `DTSTART:${nowUtc}`,
        `DTEND:${endUtc}`,
        `DTSTAMP:${nowUtc}`,
        `UID:no-exams-${Date.now()}@upv-cal`,
        `CREATED:${nowUtc}`,
        `DESCRIPTION:No exams found for the specified criteria. ${filterDesc}. Please check your filters or try again later when new exam schedules are available.`,
        `LAST-MODIFIED:${nowUtc}`,
        'LOCATION:',
        'SEQUENCE:0',
        'STATUS:TENTATIVE',
        'SUMMARY:No Exams Found - Check Filters',
        'TRANSP:TRANSPARENT',
        'UPV_BGCOLOR:#FF6B35',
        'UPV_FGCOLOR:#ffffff',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');
      
      console.log(`📤 [ICAL-API] Returning "No Exams" calendar (${emptyContent.length} chars)`);
      
      return new NextResponse(emptyContent, { 
        status: 200, 
        headers: getOptimalHeaders(sanitizedCalendarName, Buffer.byteLength(emptyContent, 'utf8')) 
      });
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
        reminderMinutes: [24 * 60, 60], // 1 day and 1 hour before
        useUPVFormat: true // Use UPV-compatible format by default
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