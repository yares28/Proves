import type { Exam } from '@/types/exam'

/**
 * Maps a row from the `exams` table to the format expected by the frontend
 */
export function mapExamData(exam: any): Exam {
  return {
    // Legacy per-year tables keyed on exam_instance_id; `exams` uses id.
    id: exam.id ?? exam.exam_instance_id,
    date: exam.exam_date,
    time: exam.exam_time || '',
    duration_minutes: exam.duration_minutes ?? 120,
    duration_day: exam.duration_day || '', // P1D, P2D, etc. for multi-day exams
    subject: exam.subject,
    subject_va: exam.subject_va || undefined,
    subject_en: exam.subject_en || undefined,
    code: exam.code?.toString() || '',
    location: exam.place || '',
    comment: exam.comment || '',
    year: exam.year?.toString() || '',
    semester: exam.semester || '',
    school: exam.school || '',
    degree: exam.degree || '',
    acronym: exam.acronym || '',
    academicYear: exam.academic_year,
  };
}
