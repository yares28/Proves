export interface Exam {
  id: number
  subject: string
  code: string
  date: string
  time: string
  duration_minutes: number
  duration_day?: string // Format: P1D, P3D, P5D etc. for whole day events
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
