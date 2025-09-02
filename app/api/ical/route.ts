import { NextResponse } from 'next/server'
import { getExams } from '@/actions/exam-actions'
import { generateICalContent } from '@/lib/utils'

function getArray(param: string | string[] | null): string[] | undefined {
  if (!param) return undefined
  if (Array.isArray(param)) return param
  return [param]
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const name = searchParams.get('name') || 'UPV Exams'

    const filters: Record<string, string[]> = {}
    const schools = searchParams.getAll('school')
    const degrees = searchParams.getAll('degree')
    const years = searchParams.getAll('year')
    const semesters = searchParams.getAll('semester')
    const subjects = searchParams.getAll('subject')

    if (schools.length) filters.school = schools
    if (degrees.length) filters.degree = degrees
    if (years.length) filters.year = years
    if (semesters.length) filters.semester = semesters
    if (subjects.length) filters.subject = subjects

    const exams = await getExams(filters)

    const ics = generateICalContent(exams, {
      calendarName: name,
      useUPVFormat: true,
    })

    return new Response(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

export async function HEAD(req: Request) {
  const res = await GET(req)
  return new Response(null, {
    status: res.status,
    headers: res.headers,
  })
}



