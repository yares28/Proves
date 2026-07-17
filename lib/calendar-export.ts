import type { ExamFilters } from '@/types/exam'

// Accepts both the app's ExamFilters shape and the raw Record<string, string[]>
// produced by the filter sidebar / saved calendars.
export type FilterBag = ExamFilters | Record<string, string | string[] | undefined>

export interface ExamRemindersSetting {
  oneHour?: boolean
  oneDay?: boolean
  oneWeek?: boolean
}

export interface ExportOptions {
  name?: string
  /** ISO-8601 reminder offsets, e.g. ['-PT1H', '-P1D']. */
  reminders?: string[]
  /** Origin hosting the ICS feed. Must be publicly reachable for Google to fetch it. */
  origin?: string
}

function appendValues(
  params: URLSearchParams,
  key: string,
  value?: string | string[]
): void {
  if (value == null) return
  const arr = Array.isArray(value) ? value : [value]
  for (const v of arr) {
    if (v != null && String(v).trim()) params.append(key, String(v).trim())
  }
}

/** Translates the user's reminder preferences into ISO-8601 offsets. */
export function remindersToIso(reminders?: ExamRemindersSetting): string[] {
  if (!reminders) return []
  const out: string[] = []
  if (reminders.oneHour) out.push('-PT1H')
  if (reminders.oneDay) out.push('-P1D')
  if (reminders.oneWeek) out.push('-P1W')
  return out
}

/** Builds the query string for the `/api/ical` feed from a set of filters. */
export function buildIcsQuery(filters: FilterBag, opts: ExportOptions = {}): string {
  const params = new URLSearchParams()
  appendValues(params, 'school', filters.school)
  appendValues(params, 'degree', filters.degree)
  appendValues(params, 'year', filters.year)
  appendValues(params, 'semester', filters.semester)
  appendValues(params, 'subject', filters.subject)
  appendValues(params, 'acronym', filters.acronym)
  if (opts.name) params.set('name', opts.name)
  for (const r of opts.reminders || []) params.append('reminder', r)
  return params.toString()
}

/**
 * Builds the Google Calendar deep link that opens the "Add calendar" dialog
 * with our ICS feed pre-filled (as a webcal:// subscription). The user only
 * has to confirm to add it to their account.
 */
export function buildGoogleCalendarUrl(filters: FilterBag, opts: ExportOptions = {}): string {
  const origin =
    opts.origin || (typeof window !== 'undefined' ? window.location.origin : '')
  const icsUrl = `${origin}/api/ical?${buildIcsQuery(filters, opts)}`
  const webcalUrl = icsUrl.replace(/^https?:/, 'webcal:')
  return `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl)}`
}

/** Opens Google Calendar in a new tab with the exam feed ready to be added. */
export function openInGoogleCalendar(filters: FilterBag, opts: ExportOptions = {}): void {
  if (typeof window === 'undefined') return
  window.open(buildGoogleCalendarUrl(filters, opts), '_blank', 'noopener,noreferrer')
}
