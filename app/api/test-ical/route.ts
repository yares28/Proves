import { NextRequest, NextResponse } from 'next/server'
import { generateICalContent } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [TEST] Testing iCal generation with empty exam list...');
    
    // Test with empty exam list to trigger placeholder event
    const icalContent = generateICalContent([], {
      calendarName: 'Test Calendar',
      timeZone: 'Europe/Madrid',
      reminderMinutes: [60]
    });
    
    console.log('✅ [TEST] Generated content length:', icalContent.length);
    console.log('📄 [TEST] Content preview:', icalContent.substring(0, 300));
    
    // Check if placeholder event was generated
    const hasPlaceholderEvent = icalContent.includes('No Exams Found');
    console.log('🔍 [TEST] Has placeholder event:', hasPlaceholderEvent);
    
    return new NextResponse(icalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('❌ [TEST] Error:', error);
    return new NextResponse(`Test failed: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      }
    });
  }
}