import type { ExamFilters } from "@/types/exam"

/**
 * Pure query-construction helpers for the exam queries in
 * `actions/exam-actions.ts`.
 *
 * They live here rather than beside their callers for two reasons. A module
 * marked `"use server"` may only export async functions, so these could not be
 * exported — and therefore could not be unit-tested — from there. And they are
 * genuinely separate concerns: turning user input into a safe PostgREST filter
 * involves no I/O, no cache and no server, so it is testable in isolation and
 * worth testing, since two of these functions encode security and correctness
 * rules that were arrived at the hard way.
 */

export type NormalizedFilters = {
  school?: string[]
  degree?: string[]
  year?: string[]
  semester?: string[]
  subject?: string[]
  acronym?: string
}

export type SubjectSelector = { name: string; acronym?: string }

/**
 * Escapes a value for safe inclusion inside a PostgREST `.or()` filter string.
 * PostgREST treats commas, parentheses and dots as structural characters, so any
 * user-supplied value embedded in an or() expression must be wrapped in double
 * quotes with internal quotes/backslashes escaped. Without this, crafted subject
 * names could alter the query grammar (filter injection).
 */
export function pgrstLiteral(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
}

/**
 * Drops empty/blank values and coerces every filter to an array.
 *
 * The output is canonical — fixed key order, sorted values — because
 * unstable_cache derives its key by serializing these arguments. Without that,
 * {school, degree} and {degree, school} would be two cache entries for one query.
 */
export function normalizeFilters(filters: ExamFilters = {}): NormalizedFilters {
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
export function likeLiteral(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}

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
export function parseSubjects(subjects: string[]): SubjectSelector[] {
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
export function subjectCondition({ name, acronym }: SubjectSelector): string {
  const byName = `subject.ilike.${pgrstLiteral(likeLiteral(name))}`
  return acronym
    ? `and(${byName},acronym.eq.${pgrstLiteral(acronym)})`
    : `subject.ilike.${pgrstLiteral(`%${likeLiteral(name)}%`)}`
}
