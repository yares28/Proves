import { NextRequest, NextResponse } from 'next/server';
import { getExams } from '@/actions/exam-actions';
import { generateICalContent } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get calendar name from query params
    const calendarName = searchParams.get('name') || 'UPV Exams';
    
    // Extract filters from query params
    const filters: Record<string, string[]> = {};
    
    // Get all filter parameters
    const schools = searchParams.getAll('school');
    const degrees = searchParams.getAll('degree');
    const years = searchParams.getAll('year');
    const semesters = searchParams.getAll('semester');
    const subjects = searchParams.getAll('subject');
    
    if (schools.length > 0) filters.school = schools;
    if (degrees.length > 0) filters.degree = degrees;
    if (years.length > 0) filters.year = years;
    if (semesters.length > 0) filters.semester = semesters;
    if (subjects.length > 0) filters.subject = subjects;
    
    console.log('🍎 [/api/ical] Filters received:', filters);
    console.log('🍎 [/api/ical] Calendar name:', calendarName);
    
    // Get exams data
    const exams = await getExams(filters);
    console.log(`🍎 [/api/ical] Retrieved ${exams.length} exams`);
    
    // Generate iCalendar content
    const icalContent = generateICalContent(exams, {
      calendarName,
      useUPVFormat: true,
      timeZone: 'Europe/Madrid'
    });
    
    console.log('🍎 [/api/ical] Generated iCal content, length:', icalContent.length);
    
    // Return iCalendar response with proper headers
    return new NextResponse(icalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${calendarName.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('❌ [/api/ical] Error generating iCalendar:', error);
    
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
