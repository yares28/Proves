import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [Test iCal] Test endpoint called')
    
    // Simple test iCal content
    const testIcalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//UPV-Cal//Test Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Test Calendar
BEGIN:VEVENT
UID:test-event@upv-cal.com
DTSTART:20241201T100000
DTEND:20241201T110000
SUMMARY:Test Event
DESCRIPTION:This is a test event
END:VEVENT
END:VCALENDAR`
    
    console.log('🧪 [Test iCal] Returning test content')
    
    return new NextResponse(testIcalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="test.ics"',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
    
  } catch (error) {
    console.error('❌ [Test iCal] Error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
