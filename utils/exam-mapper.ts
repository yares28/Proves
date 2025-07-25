/**
 * Maps a row from the ETSINF table to the format expected by the frontend
 */
export function mapExamData(exam: any) {
  return {
    id: exam.exam_instance_id,
    date: exam.exam_date,
    time: exam.exam_time,
    duration_minutes: exam.duration_minutes || 120, // Default to 2 hours if not specified
    subject: exam.subject,
    code: exam.code?.toString() || '',
    location: exam.place || '', // Only use place column for location
    comment: exam.comment || '', // Only use comment column for comments
    year: exam.year?.toString() || '',
    semester: exam.semester || '',
    school: exam.school || '',
    degree: exam.degree || '',
    acronym: exam.acronym || '',
    // Add any other fields needed by frontend
  };
} 