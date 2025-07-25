/**
 * Extracts location information from comment text when place field is empty
 */
function extractLocationFromComment(comment: string): { location: string; cleanedComment: string } {
  if (!comment) return { location: '', cleanedComment: '' };
  
  // Pattern 1: "Location:..." format
  const locationMatch = comment.match(/Location:\s*([^⋅\n]+)/i);
  if (locationMatch) {
    const location = locationMatch[1].trim();
    // Remove the location part from comment
    const cleanedComment = comment.replace(/Location:\s*[^⋅\n]+/i, '').trim();
    return { location, cleanedComment };
  }
  
  // Pattern 2: Room codes like "1G 0.1, 1G 0.2" at the beginning or after specific keywords
  const roomPattern = /(?:^|\s)([0-9]+[A-Z]\s+[0-9]+\.[0-9]+(?:\s*,\s*[0-9]+[A-Z]\s+[0-9]+\.[0-9]+)*)/;
  const roomMatch = comment.match(roomPattern);
  if (roomMatch) {
    const location = roomMatch[1].trim();
    // Only extract if it looks like a substantial location (multiple rooms or clear room format)
    if (location.includes(',') || location.match(/^[0-9]+[A-Z]\s+[0-9]+\.[0-9]+$/)) {
      const cleanedComment = comment.replace(roomMatch[0], '').trim();
      return { location, cleanedComment };
    }
  }
  
  // Pattern 3: Look for common location keywords followed by room information
  const locationKeywords = ['aula', 'sala', 'laboratorio', 'lab', 'room'];
  for (const keyword of locationKeywords) {
    const keywordPattern = new RegExp(`${keyword}\\s*:?\\s*([^⋅\\n,]+)`, 'i');
    const keywordMatch = comment.match(keywordPattern);
    if (keywordMatch) {
      const location = keywordMatch[1].trim();
      const cleanedComment = comment.replace(keywordMatch[0], '').trim();
      return { location, cleanedComment };
    }
  }
  
  return { location: '', cleanedComment: comment };
}

/**
 * Maps a row from the ETSINF table to the format expected by the frontend
 */
export function mapExamData(exam: any) {
  const comment = exam.comment || '';
  let location = exam.place || '';
  let processedComment = comment;
  
  // If no location in place field, try to extract from comment
  if (!location && comment) {
    const extracted = extractLocationFromComment(comment);
    location = extracted.location;
    processedComment = extracted.cleanedComment;
  }
  
  return {
    id: exam.exam_instance_id,
    date: exam.exam_date,
    time: exam.exam_time,
    duration_minutes: exam.duration_minutes || 120, // Default to 2 hours if not specified
    subject: exam.subject,
    code: exam.code?.toString() || '',
    location: location,
    comment: processedComment, // Use cleaned comment with location removed
    year: exam.year?.toString() || '',
    semester: exam.semester || '',
    school: exam.school || '',
    degree: exam.degree || '',
    acronym: exam.acronym || '',
    // Add any other fields needed by frontend
  };
} 