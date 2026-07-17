export interface Exam {
  id: number
  subject: string
  /** Valencià subject name, when the upstream API provides one. */
  subject_va?: string
  /** English subject name, when the upstream API provides one. */
  subject_en?: string
  code: string
  date: string
  time: string
  duration_minutes: number
  duration_day?: string // P1D, P2D, etc. for multi-day exams
  location: string
  comment?: string
  school: string
  degree: string
  year: string
  semester: string
  acronym?: string
  /** Course start year: 2025 = the 2025-2026 course. */
  academicYear: number
  created_at?: string
}

export interface ExamFilters {
  school?: string | string[]
  degree?: string | string[]
  year?: string | string[]
  semester?: string | string[]
  subject?: string | string[]
  acronym?: string
}

/**
 * A selectable subject. `value` is the Castellano "Name (ACR)" string and is the
 * identity — it goes in the URL and in saved calendars, and never changes with
 * the display language. `va`/`en` are labels, absent when untranslated.
 */
export interface SubjectOption {
  value: string
  va?: string
  en?: string
}

/** The full cascading filter tree, as returned by the `filter_options` RPC. */
export interface FilterOptions {
  schools: string[]
  degrees: string[]
  semesters: string[]
  years: number[]
  subjects: SubjectOption[]
}

/** The current selection at each level of the cascade. */
export interface FilterSelection {
  schools?: string[]
  degrees?: string[]
  semesters?: string[]
  years?: string[]
}
