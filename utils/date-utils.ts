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
 * Parse academic year from exam dates and determine the current academic year
 * @param examDates - Array of exam date strings (YYYY-MM-DD format)
 * @returns Object with startYear and endYear of the academic year
 */
export function detectAcademicYearFromExams(examDates: string[]): { startYear: number; endYear: number } | null {
  if (!examDates || examDates.length === 0) {
    return null;
  }

  // Parse all dates and extract years and months
  const dateInfo = examDates
    .map(dateStr => {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1, // Convert to 1-12
        date: date
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.date.getTime() - b!.date.getTime());

  if (dateInfo.length === 0) return null;

  // Group dates by academic year patterns
  const academicYears = new Map<string, { startYear: number; endYear: number; count: number }>();

  dateInfo.forEach(info => {
    if (!info) return;
    
    let academicStartYear: number;
    
    // Determine academic year based on month
    if (info.month >= 9) {
      // Sep-Dec: academic year starts this calendar year
      academicStartYear = info.year;
    } else {
      // Jan-Aug: academic year started previous calendar year
      academicStartYear = info.year - 1;
    }
    
    const academicEndYear = academicStartYear + 1;
    const key = `${academicStartYear}-${academicEndYear}`;
    
    if (academicYears.has(key)) {
      academicYears.get(key)!.count++;
    } else {
      academicYears.set(key, {
        startYear: academicStartYear,
        endYear: academicEndYear,
        count: 1
      });
    }
  });

  // Return the academic year with the most exams
  let bestAcademicYear = null;
  let maxCount = 0;

  for (const [key, yearInfo] of academicYears) {
    if (yearInfo.count > maxCount) {
      maxCount = yearInfo.count;
      bestAcademicYear = yearInfo;
    }
  }

  return bestAcademicYear;
}

/**
 * Get the correct year for a month in academic year context
 * @param month - Month number (1-12)
 * @param academicStartYear - The start year of the academic year (optional, will detect from current data if not provided)
 * @returns The correct year for the month in academic year context
 */
export function getAcademicYearForMonth(month: number, academicStartYear?: number): number {
  // If no academic start year provided, fall back to current year logic (for backwards compatibility)
  if (academicStartYear === undefined) {
    const currentYear = getCurrentYear();
    
    // If months 9-12 (Sep-Dec), use previous calendar year
    if (month >= 9 && month <= 12) {
      return currentYear - 1;
    }
    
    // For months 1-8 (Jan-Aug), use current calendar year
    return currentYear;
  }

  // Use provided academic year
  if (month >= 9 && month <= 12) {
    // Sep-Dec: use the academic start year
    return academicStartYear;
  } else {
    // Jan-Aug: use the academic end year (start year + 1)
    return academicStartYear + 1;
  }
}

/**
 * Generate academic year calendar months for a specific academic year
 * @param academicStartYear - The start year of the academic year
 * @returns Array of month data for the academic year
 */
export function generateAcademicYearMonths(academicStartYear: number) {
  const months = [];
  
  // Academic year order: Sep, Oct, Nov, Dec (start year) -> Jan, Feb, Mar, Apr, May, Jun, Jul, Aug (end year)
  const monthSequence = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
  
  for (const month of monthSequence) {
    const year = month >= 9 ? academicStartYear : academicStartYear + 1;
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // Convert to Monday-first format (0 = Monday, ..., 6 = Sunday)
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6; // Sunday becomes 6 in Monday-first format
    
    months.push({
      name: firstDayOfMonth.toLocaleString('default', { month: 'long' }),
      days: daysInMonth,
      startDay: startDay,
      monthNumber: month,
      year: year
    });
  }
  
  return months;
} 