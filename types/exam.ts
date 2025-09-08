export interface Exam {
  id: number
  subject: string
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
  created_at?: string
}

export interface ExamFilters {
  school?: string | string[]
  degree?: string | string[]
  year?: string
  semester?: string
  subject?: string
  acronym?: string
}
