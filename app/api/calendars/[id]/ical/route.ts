import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getExams } from '@/actions/exam-actions'
import { generateICalContent } from '@/lib/utils'

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, '').trim() || 'calendar'
}

export async function GET(_req: Request, context: { params: { id: string } }) {
  try {
    const id = context?.params?.id
    if (!id) {
      return NextResponse.json({ error: 'Missing calendar id' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: calendar, error } = await supabase
      .from('user_calendars')
      .select('name, filters')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!calendar) {
      return NextResponse.json({ error: 'Calendar not found' }, { status: 404 })
    }

    const filters = (calendar as any).filters || {}
    const name = (calendar as any).name || 'UPV Exams'

    const exams = await getExams(filters)

    const ics = generateICalContent(exams, {
      calendarName: name,
      useUPVFormat: true,
    })

    const filename = `${sanitizeFilename(name)}.ics`

    return new Response(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

export async function HEAD(req: Request, context: { params: { id: string } }) {
  const res = await GET(req, context)
  return new Response(null, {
    status: res.status,
    headers: res.headers,
  })
}



