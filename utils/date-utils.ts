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

/**
 * Get the correct year for a month in academic year context
 * For academic year, September-December are in the previous calendar year
 * compared to January-August
 * 
 * @param month - Month number (1-12)
 * @returns The correct year for the month in academic year context
 */
export function getAcademicYearForMonth(month: number): number {
  const currentYear = getCurrentYear();
  
  // If months 9-12 (Sep-Dec), use previous calendar year
  if (month >= 9 && month <= 12) {
    return currentYear - 1;
  }
  
  // For months 1-8 (Jan-Aug), use current calendar year
  return currentYear;
} 