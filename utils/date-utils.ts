/**
 * Utility functions for working with dates in the calendar
 */

/**
 * Format a date as YYYY-MM-DD, which is the format used in exam records
 */
export function formatDateString(year: number, month: number, day: number): string {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

/**
 * Debug function to check if an exam date matches a calendar date
 */
export function debugDateMatch(calendarDate: string, examDate: string, examId: string | number): boolean {
  const matches = calendarDate === examDate;
  console.log(`Date comparison: Calendar ${calendarDate} vs Exam ${examDate} (ID: ${examId}) => ${matches ? 'MATCH' : 'NO MATCH'}`);
  return matches;
}

/**
 * Get the current year or a specified year
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
} 