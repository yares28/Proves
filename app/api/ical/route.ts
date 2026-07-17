import { NextRequest, NextResponse } from 'next/server'
import { getExams } from '@/actions/exam-actions'
import { buildIcs, parseIsoDurationToMinutes } from '@/lib/ics'
import { parseLocale } from '@/lib/i18n'
import type { ExamFilters } from '@/types/exam'

export const dynamic = 'force-dynamic'

/** Collects repeated and comma-separated query values into a clean string array. */
function paramList(sp: URLSearchParams, key: string): string[] {
  return sp
    .getAll(key)
    .flatMap((v) => v.split(','))
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Public iCalendar feed. Returns a `text/calendar` document for the exams that
 * match the supplied filters, suitable for subscription from Google Calendar,
 * Apple Calendar, etc. No authentication — it only exposes public exam data.
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams

    const filters: ExamFilters = {}
    const school = paramList(sp, 'school')
    if (school.length) filters.school = school
    const degree = paramList(sp, 'degree')
    if (degree.length) filters.degree = degree
    const year = paramList(sp, 'year')
    if (year.length) filters.year = year
    const semester = paramList(sp, 'semester')
    if (semester.length) filters.semester = semester
    const subject = paramList(sp, 'subject')
    if (subject.length) filters.subject = subject
    const acronym = sp.get('acronym')
    if (acronym) filters.acronym = acronym

    const name = sp.get('name') || 'Calendario de Exámenes UPV'
    const reminderMinutes = paramList(sp, 'reminder')
      .map(parseIsoDurationToMinutes)
      .filter((n): n is number => n !== null)

    // Unknown or missing values fall back to Castellano.
    const locale = parseLocale(sp.get('lang'))

    const exams = await getExams(filters)
    const ics = buildIcs(exams, { name, reminderMinutes, locale })

    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="upv-examenes.ics"',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating ICS feed:', error)
    return NextResponse.json({ error: 'Failed to generate calendar feed' }, { status: 500 })
  }
}
