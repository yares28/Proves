import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Create the most basic valid iCalendar that Google Calendar should accept
  const minimalCalendar = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:test-${Date.now()}@test.com
DTSTART:20250725T120000Z
DTEND:20250725T130000Z
SUMMARY:Test Event
DESCRIPTION:This is a test event to verify Google Calendar compatibility
LOCATION:Test Location
CREATED:20250723T120000Z
LAST-MODIFIED:20250723T120000Z
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  return new NextResponse(minimalCalendar, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="test.ics"',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}