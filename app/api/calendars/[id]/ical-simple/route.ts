import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Set CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  try {
    console.log('📅 [Simple iCal] Starting for calendar:', params.id)
    
    // Get token from URL parameters
    const rawToken = request.nextUrl.searchParams.get('token')
    
    if (!rawToken) {
      return new NextResponse('Token required', { status: 401, headers: corsHeaders })
    }
    
    // URL decode the token (in case it was double-encoded)
    const token = decodeURIComponent(rawToken)
    
    console.log('🔍 [Token Debug] Raw token from URL:', rawToken)
    console.log('🔍 [Token Debug] Decoded token:', token)
    console.log('🔍 [Token Debug] Tokens are same:', rawToken === token)
    
    // Decode and validate token
    let calendarId, userId, timestamp;
    try {
      console.log('🔍 [Token Decode] Original token:', token)
      console.log('🔍 [Token Decode] Token length:', token.length)
      
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      console.log('🔍 [Token Decode] Decoded string:', decoded)
      
      const parts = decoded.split(':')
      console.log('🔍 [Token Decode] Split parts:', parts)
      console.log('🔍 [Token Decode] Parts count:', parts.length)
      
      if (parts.length !== 3) throw new Error(`Invalid token format: expected 3 parts, got ${parts.length}`)
      
      calendarId = parts[0]
      userId = parts[1] 
      timestamp = parts[2]
      
      console.log('🔍 [Token Decode] Extracted values:', {
        calendarId,
        userId,
        timestamp,
        calendarIdType: typeof calendarId,
        userIdType: typeof userId
      })
      
      if (calendarId !== params.id) {
        console.error('❌ [Simple iCal] Calendar ID mismatch:', {
          tokenCalendarId: calendarId,
          urlCalendarId: params.id,
          tokenParts: parts
        })
        throw new Error(`Calendar ID mismatch: token=${calendarId}, url=${params.id}`)
      }
      
      const tokenAge = Date.now() - parseInt(timestamp)
      if (tokenAge > 7 * 24 * 60 * 60 * 1000) throw new Error('Token expired')
      
    } catch (tokenError) {
      console.error('❌ [Simple iCal] Token error:', tokenError)
      return new NextResponse(`Invalid token: ${tokenError.message}`, { 
        status: 401, 
        headers: corsHeaders 
      })
    }
    
    // Create basic Supabase client (public API)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new NextResponse('Missing Supabase configuration', { 
        status: 500, 
        headers: corsHeaders 
      })
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // For now, return a simple test calendar
    const testIcalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//UPV-Cal//Test Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Test Calendar - ${calendarId}
X-WR-CALDESC:Test calendar for debugging
BEGIN:VEVENT
UID:test-event-${Date.now()}@upv-cal.com
DTSTART:20241201T100000
DTEND:20241201T110000
SUMMARY:Test Event
DESCRIPTION:This is a test event for calendar ${calendarId}
END:VEVENT
END:VCALENDAR`

    console.log('✅ [Simple iCal] Returning test calendar')
    
    return new NextResponse(testIcalContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="test-calendar.ics"',
        'Cache-Control': 'public, max-age=300',
        'X-WR-CALNAME': `Test Calendar - ${calendarId}`,
        'X-WR-CALDESC': 'Test calendar for debugging',
      },
    })
    
  } catch (error) {
    console.error('❌ [Simple iCal] Unexpected error:', error)
    return new NextResponse(`Server error: ${error instanceof Error ? error.message : 'Unknown'}`, { 
      status: 500, 
      headers: corsHeaders 
    })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
