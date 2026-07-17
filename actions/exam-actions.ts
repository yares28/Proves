"use server"

import { unstable_cache } from "next/cache"
import { supabase, EXAMS_TABLE } from "@/lib/supabase"
import { EXAMS_CACHE_TAG } from "@/lib/cache-tags"
import { currentAcademicYear } from "@/lib/academic-year"
import type { Exam, ExamFilters, FilterOptions, FilterSelection } from "@/types/exam"
import { mapExamData } from "@/utils/exam-mapper"

/**
 * Data access for exams.
 *
 * Two rules shape this file:
 *
 *  1. Everything is scoped to one `academic_year`. There are no per-year tables
 *     and no table names in any signature.
 *  2. Caching is Next's, not ours. Exam data only changes when the scraper
 *     applies a diff, at which point it purges EXAMS_CACHE_TAG via
 *     /api/revalidate. The old in-module Map cache was per-lambda, so on Vercel
 *     each instance kept its own copy and hit rates were far below what the
 *     TTLs implied; unstable_cache is shared and invalidated on real events.
 *
 * `revalidate` is a backstop in case a revalidation ping is ever missed.
 */
const CACHE_BACKSTOP_SECONDS = 60 * 60

const EXAM_COLUMNS =
  'id, academic_year, exam_date, exam_time, duration_minutes, duration_day, code, ' +
  'subject, subject_va, subject_en, acronym, degree, year, semester, place, comment, school'

/**
 * Escapes a value for safe inclusion inside a PostgREST `.or()` filter string.
 * PostgREST treats commas, parentheses and dots as structural characters, so any
 * user-supplied value embedded in an or() expression must be wrapped in double
 * quotes with internal quotes/backslashes escaped. Without this, crafted subject
 * names could alter the query grammar (filter injection).
 */
function pgrstLiteral(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
}

type NormalizedFilters = {
  school?: string[]
  degree?: string[]
  year?: string[]
  semester?: string[]
  subject?: string[]
  acronym?: string
}

/**
 * Drops empty/blank values and coerces every filter to an array.
 *
 * The output is canonical — fixed key order, sorted values — because
 * unstable_cache derives its key by serializing these arguments. Without that,
 * {school, degree} and {degree, school} would be two cache entries for one query.
 */
function normalizeFilters(filters: ExamFilters = {}): NormalizedFilters {
  const normalized: NormalizedFilters = {}
  if (!filters || typeof filters !== 'object') return normalized

  const clean = (value: string | string[] | undefined): string[] | undefined => {
    if (value === null || value === undefined) return undefined
    const cleaned = (Array.isArray(value) ? value : [value])
      .filter((v): v is string => typeof v === 'string')
      .map(v => v.trim())
      .filter(Boolean)
      .sort()
    return cleaned.length ? cleaned : undefined
  }

  // Assigned in a fixed order; `undefined` keys are omitted from the JSON key.
  const school = clean(filters.school)
  if (school) normalized.school = school
  const degree = clean(filters.degree)
  if (degree) normalized.degree = degree
  const semester = clean(filters.semester)
  if (semester) normalized.semester = semester
  const year = clean(filters.year)
  if (year) normalized.year = year
  const subject = clean(filters.subject)
  if (subject) normalized.subject = subject
  if (typeof filters.acronym === 'string' && filters.acronym.trim()) {
    normalized.acronym = filters.acronym.trim()
  }

  return normalized
}

/** Escapes LIKE/ILIKE wildcards so a subject name matches literally. */
function likeLiteral(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}

type SubjectSelector = { name: string; acronym?: string }

/**
 * Subjects reach us as "Bases de datos (BDA)" from the sidebar and saved
 * calendars, or as a bare name from a URL.
 *
 * The acronym alone does NOT identify a subject: it is scoped to a degree, so
 * BDA is "Bases de datos" in GCD and "Bases de datos y sistemas de información"
 * in GIINF. Matching on acronym alone returned both — a GCD student saw nine
 * exams from a degree they are not enrolled in. Name and acronym together are
 * what identify a course.
 *
 * The trailing group is the acronym, so names containing parentheses
 * ("English for Computing (B2) (IN2)") split correctly.
 */
function parseSubjects(subjects: string[]): SubjectSelector[] {
  return subjects.map(raw => {
    const match = raw.match(/^(.*)\(([^()]+)\)\s*$/)
    if (match) return { name: match[1].trim(), acronym: match[2].trim() }
    return { name: raw.trim() }
  })
}

/**
 * A PostgREST condition identifying one subject. Names are compared with ilike
 * and no wildcards — an exact match that ignores case, because the same course
 * is spelled "Análisis matemático" in one degree and "Análisis Matemático" in
 * another, and because filters saved before any spelling change must keep
 * resolving.
 */
function subjectCondition({ name, acronym }: SubjectSelector): string {
  const byName = `subject.ilike.${pgrstLiteral(likeLiteral(name))}`
  return acronym
    ? `and(${byName},acronym.eq.${pgrstLiteral(acronym)})`
    : `subject.ilike.${pgrstLiteral(`%${likeLiteral(name)}%`)}`
}

const fetchExams = unstable_cache(
  async (academicYear: number, filters: NormalizedFilters): Promise<Exam[]> => {
    let query = supabase
      .from(EXAMS_TABLE)
      .select(EXAM_COLUMNS)
      .eq('academic_year', academicYear)
      // Soft-deleted exams (vanished from upstream) are never shown.
      .is('deleted_at', null)
      .order('exam_date', { ascending: true })

    // Applied in cascade order so the composite indexes are usable.
    if (filters.school?.length) {
      query = filters.school.length === 1
        ? query.eq('school', filters.school[0])
        : query.in('school', filters.school)
    }

    if (filters.degree?.length) {
      query = filters.degree.length === 1
        ? query.eq('degree', filters.degree[0])
        : query.in('degree', filters.degree)
    }

    if (filters.semester?.length) {
      query = filters.semester.length === 1
        ? query.eq('semester', filters.semester[0])
        : query.in('semester', filters.semester)
    }

    if (filters.year?.length) {
      // `year` is the course year (smallint), not a date.
      const years = filters.year.map(Number).filter(n => Number.isFinite(n))
      if (years.length === 1) query = query.eq('year', years[0])
      else if (years.length > 1) query = query.in('year', years)
    }

    if (filters.subject?.length) {
      // OR across the selected subjects; each one is an AND of name + acronym.
      query = query.or(parseSubjects(filters.subject).map(subjectCondition).join(','))
    }

    if (filters.acronym) {
      query = query.ilike('acronym', `%${filters.acronym}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return (data ?? []).map(mapExamData)
  },
  ['exams'],
  { tags: [EXAMS_CACHE_TAG], revalidate: CACHE_BACKSTOP_SECONDS }
)

/**
 * Exams matching `filters`, for one academic year (defaults to the course in
 * progress). Returns [] on failure — callers render an empty calendar rather
 * than an error page.
 */
export async function getExams(
  filters: ExamFilters = {},
  academicYear?: number
): Promise<Exam[]> {
  try {
    return await fetchExams(academicYear ?? currentAcademicYear(), normalizeFilters(filters))
  } catch (error) {
    console.error('Error fetching exams:', error)
    return []
  }
}

const fetchFilterOptions = unstable_cache(
  async (academicYear: number, selection: Required<FilterSelection>): Promise<FilterOptions> => {
    // One RPC returns the whole cascade. This previously took five queries, each
    // selecting an entire column across every row and de-duplicating in JS.
    const { data, error } = await supabase.rpc('filter_options', {
      p_academic_year: academicYear,
      p_schools: selection.schools.length ? selection.schools : null,
      p_degrees: selection.degrees.length ? selection.degrees : null,
      p_semesters: selection.semesters.length ? selection.semesters : null,
      p_years: selection.years.length
        ? selection.years.map(Number).filter(n => Number.isFinite(n))
        : null,
    })

    if (error) throw error

    const options = (data ?? {}) as Partial<FilterOptions>
    return {
      schools: options.schools ?? [],
      degrees: options.degrees ?? [],
      semesters: options.semesters ?? [],
      years: options.years ?? [],
      subjects: options.subjects ?? [],
    }
  },
  ['filter-options'],
  { tags: [EXAMS_CACHE_TAG], revalidate: CACHE_BACKSTOP_SECONDS }
)

const EMPTY_OPTIONS: FilterOptions = {
  schools: [], degrees: [], semesters: [], years: [], subjects: [],
}

/**
 * The cascading filter tree (School -> Degree -> Semester -> Year -> Subject)
 * narrowed by the current selection, in a single round trip.
 */
export async function getFilterOptions(
  selection: FilterSelection = {},
  academicYear?: number
): Promise<FilterOptions> {
  try {
    return await fetchFilterOptions(academicYear ?? currentAcademicYear(), {
      schools: selection.schools ?? [],
      degrees: selection.degrees ?? [],
      semesters: selection.semesters ?? [],
      years: selection.years ?? [],
    })
  } catch (error) {
    console.error('Error fetching filter options:', error)
    return EMPTY_OPTIONS
  }
}

const toArray = (value?: string | string[]): string[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value]

/*
 * Single-level accessors. Each is one cached RPC, so callers that only need one
 * level (the sitemap, the quick-search card) stay simple; the sidebar should use
 * getFilterOptions and take the whole tree at once.
 */

export async function getSchools(academicYear?: number): Promise<string[]> {
  return (await getFilterOptions({}, academicYear)).schools
}

export async function getDegrees(
  schools?: string | string[],
  academicYear?: number
): Promise<string[]> {
  return (await getFilterOptions({ schools: toArray(schools) }, academicYear)).degrees
}

export async function getSemesters(
  schools?: string | string[],
  degrees?: string | string[],
  academicYear?: number
): Promise<string[]> {
  const options = await getFilterOptions(
    { schools: toArray(schools), degrees: toArray(degrees) },
    academicYear
  )
  return options.semesters
}

export async function getYears(
  schools?: string | string[],
  degrees?: string | string[],
  semesters?: string | string[],
  academicYear?: number
): Promise<number[]> {
  const options = await getFilterOptions(
    { schools: toArray(schools), degrees: toArray(degrees), semesters: toArray(semesters) },
    academicYear
  )
  return options.years
}

/**
 * Subject names in Castellano, for callers that just want a list of strings.
 * The sidebar uses getFilterOptions instead, which carries every language.
 */
export async function getSubjects(
  schools?: string | string[],
  degrees?: string | string[],
  semesters?: string | string[],
  years?: string | string[],
  academicYear?: number
): Promise<string[]> {
  const options = await getFilterOptions(
    {
      schools: toArray(schools),
      degrees: toArray(degrees),
      semesters: toArray(semesters),
      years: toArray(years),
    },
    academicYear
  )
  return options.subjects.map(subject => subject.value)
}

const fetchAcademicYears = unstable_cache(
  async (): Promise<number[]> => {
    const { data, error } = await supabase.rpc('academic_years')
    if (error) throw error
    return (data ?? []) as number[]
  },
  ['academic-years'],
  { tags: [EXAMS_CACHE_TAG], revalidate: CACHE_BACKSTOP_SECONDS }
)

/** Every course with exams on record, newest first. Drives the year picker. */
export async function getAcademicYears(): Promise<number[]> {
  try {
    const years = await fetchAcademicYears()
    return years.length ? years : [currentAcademicYear()]
  } catch (error) {
    console.error('Error fetching academic years:', error)
    return [currentAcademicYear()]
  }
}

const fetchAcronymsAndSubjects = unstable_cache(
  async (
    academicYear: number,
    school: string | null,
    degree: string | null
  ): Promise<Array<{ value: string; type: 'acronym' | 'subject'; acronym?: string }>> => {
    let query = supabase
      .from(EXAMS_TABLE)
      .select('acronym, subject')
      .eq('academic_year', academicYear)
      .is('deleted_at', null)
      .not('acronym', 'is', null)
      .not('acronym', 'eq', '')
      .order('acronym', { ascending: true })

    if (school) query = query.eq('school', school)
    if (degree) query = query.eq('degree', degree)

    const { data, error } = await query
    if (error) throw error

    const acronyms = new Set<string>()
    const subjects = new Map<string, string>() // subject -> acronym

    for (const row of (data ?? []) as Array<{ acronym: string; subject: string }>) {
      if (row.acronym) acronyms.add(row.acronym)
      if (row.subject) subjects.set(row.subject, row.acronym)
    }

    return [
      ...Array.from(acronyms).map(value => ({ value, type: 'acronym' as const })),
      ...Array.from(subjects).map(([value, acronym]) => ({ value, type: 'subject' as const, acronym })),
    ].sort((a, b) => a.value.localeCompare(b.value))
  },
  ['acronyms-and-subjects'],
  { tags: [EXAMS_CACHE_TAG], revalidate: CACHE_BACKSTOP_SECONDS }
)

/**
 * Acronyms and subject names for the quick-search box, tagged by which kind
 * each entry is so the UI can label them.
 */
export async function getFilteredAcronymsAndSubjects(
  school?: string,
  degree?: string,
  academicYear?: number
): Promise<Array<{ value: string; type: 'acronym' | 'subject'; acronym?: string }>> {
  try {
    return await fetchAcronymsAndSubjects(
      academicYear ?? currentAcademicYear(),
      school && school !== 'all' ? school : null,
      degree && degree !== 'all' ? degree : null
    )
  } catch (error) {
    console.error('Error fetching acronyms and subjects:', error)
    return []
  }
}

const fetchExamStats = unstable_cache(
  async (academicYear: number) => {
    const [exams, options] = await Promise.all([
      supabase
        .from(EXAMS_TABLE)
        .select('id', { count: 'exact', head: true })
        .eq('academic_year', academicYear)
        .is('deleted_at', null),
      fetchFilterOptions(academicYear, { schools: [], degrees: [], semesters: [], years: [] }),
    ])

    if (exams.error) throw exams.error

    return {
      exams: exams.count ?? 0,
      schools: options.schools.length,
      degrees: options.degrees.length,
      subjects: options.subjects.length,
    }
  },
  ['exam-stats'],
  { tags: [EXAMS_CACHE_TAG], revalidate: CACHE_BACKSTOP_SECONDS }
)

export interface ExamStats {
  exams: number
  schools: number
  degrees: number
  subjects: number
}

/** Real counts for the statistics section. */
export async function getExamStats(academicYear?: number): Promise<ExamStats> {
  try {
    return await fetchExamStats(academicYear ?? currentAcademicYear())
  } catch (error) {
    console.error('Error fetching exam stats:', error)
    return { exams: 0, schools: 0, degrees: 0, subjects: 0 }
  }
}
