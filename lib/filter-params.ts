import type { ExamFilters } from '@/types/exam'

export type ActiveFilters = Record<string, string[]>

export const FILTER_KEYS = ['school', 'degree', 'semester', 'year', 'subject'] as const

/**
 * The URL is the source of truth for the filter selection: it makes every
 * filtered view shareable and bookmarkable, survives a refresh, and lets the
 * page be rendered on the server instead of after hydration.
 */

/**
 * Keys whose values are safe to comma-split. Subjects are deliberately absent:
 * real subject names contain commas ("Alemán académico y profesional A1
 * (AA14,5)"), so splitting them would silently break that filter. Subjects
 * travel as repeated params only.
 */
const COMMA_SPLIT: ReadonlySet<string> = new Set(['school', 'degree', 'semester', 'year'])

type ParamsInput = URLSearchParams | Record<string, string | string[] | undefined>

function readValues(input: ParamsInput, key: string): string[] {
  let raw: string[]
  if (input instanceof URLSearchParams) {
    raw = input.getAll(key)
  } else {
    const value = input[key]
    raw = value === undefined ? [] : Array.isArray(value) ? value : [value]
  }

  const parts = COMMA_SPLIT.has(key) ? raw.flatMap(v => v.split(',')) : raw
  return Array.from(new Set(parts.map(s => s.trim()).filter(Boolean)))
}

/** Reads a filter selection out of a URL query (or Next's searchParams object). */
export function parseFilterParams(input: ParamsInput): ActiveFilters {
  const filters: ActiveFilters = {}
  for (const key of FILTER_KEYS) {
    const values = readValues(input, key)
    if (values.length) filters[key] = values
  }
  return filters
}

/** Serializes a selection back into a query string, in a stable key order. */
export function filtersToSearchParams(filters: ActiveFilters): URLSearchParams {
  const params = new URLSearchParams()
  for (const key of FILTER_KEYS) {
    for (const value of filters[key] ?? []) params.append(key, value)
  }
  return params
}

/**
 * Whether a selection is narrow enough to be worth rendering. A school or a
 * degree on its own still matches most of the year's exams, so the calendar
 * waits for a semester, year or subject before showing anything.
 */
export function hasMeaningfulFilters(filters: ActiveFilters): boolean {
  return FILTER_KEYS.some(
    key => key !== 'school' && key !== 'degree' && (filters[key]?.length ?? 0) > 0
  )
}

export const toExamFilters = (filters: ActiveFilters): ExamFilters => filters as ExamFilters
