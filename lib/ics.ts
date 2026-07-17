import { fromZonedTime } from 'date-fns-tz'
import { DEFAULT_LOCALE, examSubject, type Locale } from '@/lib/i18n'
import type { Exam } from '@/types/exam'

// All UPV exam times are local to Valencia.
const TZ = 'Europe/Madrid'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Formats a Date as a UTC iCalendar timestamp: YYYYMMDDTHHMMSSZ */
function toUtcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

/** Escapes a text value per RFC 5545 (backslash, comma, semicolon, newline). */
function escapeText(value: string): string {
  return (value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** Folds a content line to <=75 octets per RFC 5545 (continuation lines start with a space). */
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  let idx = 0
  while (idx < line.length) {
    chunks.push((idx === 0 ? '' : ' ') + line.slice(idx, idx + 73))
    idx += 73
  }
  return chunks.join('\r\n')
}

/**
 * Parses an ISO-8601 duration (optionally signed) into a number of minutes.
 * Accepts forms like `-P1D`, `-PT1H`, `-PT30M`, `-P1W`, `P1DT2H`.
 * Returns the magnitude in minutes, or null if it can't be parsed.
 */
export function parseIsoDurationToMinutes(iso: string): number | null {
  const m = /^-?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
    (iso || '').trim()
  )
  if (!m) return null
  const [, w, d, h, min, s] = m
  if (!w && !d && !h && !min && !s) return null
  const total =
    Number(w || 0) * 7 * 24 * 60 +
    Number(d || 0) * 24 * 60 +
    Number(h || 0) * 60 +
    Number(min || 0) +
    Math.round(Number(s || 0) / 60)
  return total
}

export interface IcsOptions {
  name?: string
  /** Reminder offsets before each exam, in minutes. */
  reminderMinutes?: number[]
  /**
   * Language for subject names. A subscribed feed is fetched by the calendar
   * app with no session, so the language has to be part of the feed URL rather
   * than read from the student's settings.
   */
  locale?: Locale
}

/**
 * Builds a valid iCalendar (RFC 5545) document from a list of exams.
 * Timed exams become timezone-correct UTC events; exams without a time
 * become all-day events.
 */
export function buildIcs(exams: Exam[], options: IcsOptions = {}): string {
  const { name = 'Calendario de Exámenes UPV', reminderMinutes = [], locale = DEFAULT_LOCALE } = options
  const stamp = toUtcStamp(new Date())

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UPV-Cal//Calendario de Examenes//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(name)}`,
    `X-WR-TIMEZONE:${TZ}`,
  ]

  for (const exam of exams) {
    if (!exam?.date) continue

    const uid = `${exam.id ?? Math.random().toString(36).slice(2)}-${exam.date}@upvcal`
    const summary = [examSubject(exam, locale), exam.acronym ? `(${exam.acronym})` : '']
      .filter(Boolean)
      .join(' ')
    const description = [
      exam.degree ? `Titulación: ${exam.degree}` : '',
      exam.year ? `Curso: ${exam.year}` : '',
      exam.semester ? `Semestre: ${exam.semester}` : '',
      exam.code ? `Código: ${exam.code}` : '',
      exam.comment || '',
    ]
      .filter(Boolean)
      .join('\n')

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTAMP:${stamp}`)

    if (exam.time && /^\d{1,2}:\d{2}/.test(exam.time)) {
      const hhmm = exam.time.slice(0, 5)
      const start = fromZonedTime(`${exam.date}T${hhmm}:00`, TZ)
      const durMin = Number(exam.duration_minutes) > 0 ? Number(exam.duration_minutes) : 120
      const end = new Date(start.getTime() + durMin * 60000)
      lines.push(`DTSTART:${toUtcStamp(start)}`)
      lines.push(`DTEND:${toUtcStamp(end)}`)
    } else {
      // All-day event: DTEND is the exclusive next day.
      const startStamp = exam.date.replace(/-/g, '')
      const endDate = new Date(`${exam.date}T00:00:00Z`)
      endDate.setUTCDate(endDate.getUTCDate() + 1)
      const endStamp = `${endDate.getUTCFullYear()}${pad(endDate.getUTCMonth() + 1)}${pad(endDate.getUTCDate())}`
      lines.push(`DTSTART;VALUE=DATE:${startStamp}`)
      lines.push(`DTEND;VALUE=DATE:${endStamp}`)
    }

    lines.push(`SUMMARY:${escapeText(summary)}`)
    if (exam.location) lines.push(`LOCATION:${escapeText(exam.location)}`)
    if (description) lines.push(`DESCRIPTION:${escapeText(description)}`)

    for (const min of reminderMinutes) {
      if (!Number.isFinite(min) || min < 0) continue
      lines.push('BEGIN:VALARM')
      lines.push('ACTION:DISPLAY')
      lines.push(`DESCRIPTION:${escapeText(summary)}`)
      lines.push(`TRIGGER:-PT${Math.round(min)}M`)
      lines.push('END:VALARM')
    }

    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
