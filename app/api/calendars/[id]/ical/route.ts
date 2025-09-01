import { NextRequest, NextResponse } from 'next/server';
import { getUserCalendar } from '@/actions/user-calendars';
import { getExams } from '@/actions/exam-actions';
import { generateICalContent } from '@/lib/utils';
import { getCurrentSession } from '@/utils/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the calendar ID from the URL
    const calendarId = params.id;
    
    console.log('🍎 [/api/calendars/[id]/ical] Calendar ID:', calendarId);
    
    // Get the user session
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the saved calendar
    const calendar = await getUserCalendar(calendarId, session.user.id);
    if (!calendar) {
      return NextResponse.json(
        { error: 'Calendar not found' },
        { status: 404 }
      );
    }
    
    console.log('🍎 [/api/calendars/[id]/ical] Calendar found:', calendar.name);
    console.log('🍎 [/api/calendars/[id]/ical] Filters:', calendar.filters);
    
    // Get exams using the saved filters
    const exams = await getExams(calendar.filters);
    console.log(`🍎 [/api/calendars/[id]/ical] Retrieved ${exams.length} exams`);
    
    // Generate iCalendar content
    const icalContent = generateICalContent(exams, {
      calendarName: calendar.name,
      useUPVFormat: true,
      timeZone: 'Europe/Madrid'
    });
    
    console.log('🍎 [/api/calendars/[id]/ical] Generated iCal content, length:', icalContent.length);
    
    // Return iCalendar response with proper headers for Apple Calendar
    return new NextResponse(icalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${calendar.name.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`,
        'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        // Apple Calendar specific headers
        'X-WR-CALNAME': calendar.name,
        'X-WR-TIMEZONE': 'Europe/Madrid',
      },
    });
    
  } catch (error) {
    console.error('❌ [/api/calendars/[id]/ical] Error generating calendar:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate calendar',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
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
  });
}
