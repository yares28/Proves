import { NextRequest, NextResponse } from 'next/server'
import { getExams } from '@/actions/exam-actions'
import { generateICalContent } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // This endpoint is designed for public access by calendar applications
    // It doesn't require authentication since it uses filters from URL parameters
    const { searchParams } = new URL(request.url)
    const filtersParam = searchParams.get('filters')
    const calendarName = searchParams.get('name') || 'UPV Exams'
    
    // Parse filters from URL parameter
    let filters = {}
    if (filtersParam) {
      try {
        filters = JSON.parse(decodeURIComponent(filtersParam))
      } catch (e) {
        console.error('Error parsing filters:', e)
        filters = {}
      }
    }
    
    // Use service role client so anonymous calendar apps can read data
    const supabase = await createAdminClient()

    // Fetch exams using the provided filters
    const exams = await getExams(filters, supabase)
    
    // Generate iCal content
    const icalContent = generateICalContent(exams, {
      calendarName,
      timeZone: 'Europe/Madrid',
      reminderMinutes: [24 * 60, 60] // 1 day and 1 hour before
    })
    
    // Return iCal content with proper headers
    return new NextResponse(icalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${calendarName}.ics"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Error generating iCal:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
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
  })
} 