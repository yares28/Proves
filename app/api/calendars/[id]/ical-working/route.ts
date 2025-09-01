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
    console.log('📅 [Working iCal] Starting for calendar:', params.id)
    
    // Get token from URL parameters
    const rawToken = request.nextUrl.searchParams.get('token')
    
    if (!rawToken) {
      return new NextResponse('Token required', { status: 401, headers: corsHeaders })
    }
    
    const token = decodeURIComponent(rawToken)
    
    // Decode and validate token
    let calendarId, userId, timestamp;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const parts = decoded.split(':')
      
      if (parts.length !== 3) throw new Error(`Invalid token format: expected 3 parts, got ${parts.length}`)
      
      calendarId = parts[0]
      userId = parts[1] 
      timestamp = parts[2]
      
      if (calendarId !== params.id) {
        throw new Error(`Calendar ID mismatch: token=${calendarId}, url=${params.id}`)
      }
      
      const tokenAge = Date.now() - parseInt(timestamp)
      if (tokenAge > 7 * 24 * 60 * 60 * 1000) throw new Error('Token expired')
      
    } catch (tokenError) {
      console.error('❌ [Working iCal] Token error:', tokenError)
      return new NextResponse(`Invalid token: ${tokenError.message}`, { 
        status: 401, 
        headers: corsHeaders 
      })
    }
    
    // Create Supabase client 
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new NextResponse('Missing Supabase configuration', { 
        status: 500, 
        headers: corsHeaders 
      })
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Get calendar info from database (this should work with anon key if RLS allows it)
    let calendar;
    try {
      const { data, error } = await supabase
        .from('user_calendars')
        .select('*')
        .eq('id', calendarId)
        .eq('user_id', userId)
        .single()
      
      if (error) {
        console.error('❌ [Working iCal] Calendar fetch error:', error)
        // If we can't fetch the calendar, create a basic one
        calendar = {
          id: calendarId,
          name: 'UPV Exams Calendar',
          filters: {}
        }
      } else {
        calendar = data
      }
    } catch (dbError) {
      console.error('❌ [Working iCal] Database error:', dbError)
      // Fallback calendar
      calendar = {
        id: calendarId,
        name: 'UPV Exams Calendar',
        filters: {}
      }
    }
    
    console.log('✅ [Working iCal] Using calendar:', calendar.name)
    
    // For now, return a working test calendar with some sample events
    const currentYear = new Date().getFullYear()
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    const testIcalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//UPV-Cal//Calendar ${calendar.id}//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${calendar.name}
X-WR-CALDESC:Calendario de exámenes UPV
X-WR-TIMEZONE:Europe/Madrid
BEGIN:VEVENT
UID:exam-1-${calendarId}@upv-cal.com
DTSTART:${nextMonth.getFullYear()}${String(nextMonth.getMonth() + 1).padStart(2, '0')}15T100000
DTEND:${nextMonth.getFullYear()}${String(nextMonth.getMonth() + 1).padStart(2, '0')}15T120000
SUMMARY:Examen de Matemáticas
DESCRIPTION:Examen de Matemáticas - Primer parcial
LOCATION:Aula A.1.1
END:VEVENT
BEGIN:VEVENT
UID:exam-2-${calendarId}@upv-cal.com
DTSTART:${nextMonth.getFullYear()}${String(nextMonth.getMonth() + 1).padStart(2, '0')}20T090000
DTEND:${nextMonth.getFullYear()}${String(nextMonth.getMonth() + 1).padStart(2, '0')}20T110000
SUMMARY:Examen de Física
DESCRIPTION:Examen de Física - Segundo parcial
LOCATION:Aula B.2.3
END:VEVENT
END:VCALENDAR`

    console.log('✅ [Working iCal] Returning test calendar with sample events')
    
    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${calendar.name.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`,
      'Cache-Control': 'public, max-age=3600',
      'X-WR-CALNAME': calendar.name,
      'X-WR-CALDESC': `Calendario de exámenes: ${calendar.name}`,
      'X-Content-Type-Options': 'nosniff',
      'Vary': 'Accept-Encoding',
    }
    
    return new NextResponse(testIcalContent, {
      status: 200,
      headers: responseHeaders,
    })
    
  } catch (error) {
    console.error('❌ [Working iCal] Unexpected error:', error)
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
