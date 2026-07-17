/**
 * Academic years are identified everywhere by their START year: 2025 means the
 * 2025-2026 course. This matches `exams.academic_year` in the database and the
 * upstream UPV API, and replaces the old per-year table names ("25-26").
 */

/** UPV courses roll over in September. */
const ACADEMIC_YEAR_START_MONTH = 9

/**
 * The course currently in progress. Between January and August we are still in
 * the course that began the previous calendar year.
 */
export function currentAcademicYear(now: Date = new Date()): number {
  const month = now.getMonth() + 1
  return month >= ACADEMIC_YEAR_START_MONTH ? now.getFullYear() : now.getFullYear() - 1
}

/** 2025 -> "2025-2026" */
export function academicYearLabel(startYear: number): string {
  return `${startYear}-${startYear + 1}`
}

/** 2025 -> "25-26" — the legacy table name, still the label students recognise. */
export function academicYearShortLabel(startYear: number): string {
  const twoDigits = (year: number) => String(year % 100).padStart(2, '0')
  return `${twoDigits(startYear)}-${twoDigits(startYear + 1)}`
}

/**
 * Parses "25-26", "2025-2026" or "2025" into a start year. Returns null for
 * anything else, so URL params can be passed in unvalidated.
 */
export function parseAcademicYear(value: string | null | undefined): number | null {
  if (!value) return null

  const full = value.match(/^(\d{4})(?:-\d{4})?$/)
  if (full) return Number(full[1])

  const short = value.match(/^(\d{2})-(\d{2})$/)
  if (short) return 2000 + Number(short[1])

  return null
}
