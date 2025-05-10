export interface Exam {
  id: number
  subject: string
  code: string
  date: string
  time: string
  location: string
  school: string
  degree: string
  year: string
  semester: string
  created_at?: string
}

export interface ExamFilters {
  school?: string | string[]
  degree?: string | string[]
  year?: string
  semester?: string
  subject?: string
  searchQuery?: string
}
