/**
 * Maps a row from the ETSINF table to the format expected by the frontend
 */
export function mapExamData(exam: any) {
  return {
    id: exam.exam_instance_id,
    date: exam.exam_date,
    time: exam.exam_time || '',
    duration_minutes: exam.duration_minutes || 120,
    subject: exam.subject,
    code: exam.code?.toString() || '',
    location: exam.place || '', 
    comment: exam.comment || '', 
    year: exam.year?.toString() || '',
    semester: exam.semester || '',
    school: exam.school || '',
    degree: exam.degree || '',
    acronym: exam.acronym || '',
    
  };
} 