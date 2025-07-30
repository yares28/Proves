import {
  formatDateString,
  debugDateMatch,
  getCurrentYear,
  detectAcademicYearFromExams,
  getAcademicYearForMonth,
  generateAcademicYearMonths
} from '@/utils/date-utils';

describe('Date Utils', () => {
  describe('formatDateString', () => {
    it('should format date correctly with single digit month and day', () => {
      expect(formatDateString(2024, 1, 5)).toBe('2024-01-05');
      expect(formatDateString(2024, 9, 1)).toBe('2024-09-01');
    });

    it('should format date correctly with double digit month and day', () => {
      expect(formatDateString(2024, 12, 25)).toBe('2024-12-25');
      expect(formatDateString(2024, 10, 15)).toBe('2024-10-15');
    });

    it('should handle edge cases', () => {
      expect(formatDateString(2024, 0, 0)).toBe('2024-00-00');
      expect(formatDateString(2024, 99, 99)).toBe('2024-99-99');
    });
  });

  describe('debugDateMatch', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should return true when dates match', () => {
      const result = debugDateMatch('2024-01-15', '2024-01-15', 'exam-123');
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Date comparison: Calendar 2024-01-15 vs Exam 2024-01-15 (ID: exam-123) => MATCH'
      );
    });

    it('should return false when dates do not match', () => {
      const result = debugDateMatch('2024-01-15', '2024-01-16', 'exam-123');
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Date comparison: Calendar 2024-01-15 vs Exam 2024-01-16 (ID: exam-123) => NO MATCH'
      );
    });

    it('should handle different date formats', () => {
      const result = debugDateMatch('2024-01-15', '2024-02-15', 'exam-456');
      expect(result).toBe(false);
    });
  });

  describe('getCurrentYear', () => {
    it('should return the current year', () => {
      const currentYear = new Date().getFullYear();
      expect(getCurrentYear()).toBe(currentYear);
    });
  });

  describe('detectAcademicYearFromExams', () => {
    it('should return null for empty exam dates', () => {
      expect(detectAcademicYearFromExams([])).toBeNull();
      expect(detectAcademicYearFromExams(null as any)).toBeNull();
    });

    it('should detect academic year from September-December exams (start year)', () => {
      const examDates = [
        '2024-09-15',
        '2024-10-20',
        '2024-11-10',
        '2024-12-05'
      ];
      const result = detectAcademicYearFromExams(examDates);
      expect(result).toEqual({
        startYear: 2024,
        endYear: 2025,
        count: 4
      });
    });

    it('should detect academic year from January-August exams (previous year start)', () => {
      const examDates = [
        '2025-01-15',
        '2025-02-20',
        '2025-03-10',
        '2025-04-05',
        '2025-05-12',
        '2025-06-08'
      ];
      const result = detectAcademicYearFromExams(examDates);
      expect(result).toEqual({
        startYear: 2024,
        endYear: 2025,
        count: 6
      });
    });

    it('should detect academic year from mixed dates', () => {
      const examDates = [
        '2024-09-15', // Sep 2024 (academic year 2024-2025)
        '2024-10-20', // Oct 2024 (academic year 2024-2025)
        '2025-01-15', // Jan 2025 (academic year 2024-2025)
        '2025-02-20', // Feb 2025 (academic year 2024-2025)
        '2025-06-08'  // Jun 2025 (academic year 2024-2025)
      ];
      const result = detectAcademicYearFromExams(examDates);
      expect(result).toEqual({
        startYear: 2024,
        endYear: 2025,
        count: 5
      });
    });

    it('should return the academic year with most exams when multiple years exist', () => {
      const examDates = [
        // Academic year 2023-2024 (3 exams)
        '2023-09-15',
        '2024-01-15',
        '2024-02-20',
        // Academic year 2024-2025 (5 exams)
        '2024-09-15',
        '2024-10-20',
        '2025-01-15',
        '2025-02-20',
        '2025-06-08'
      ];
      const result = detectAcademicYearFromExams(examDates);
      expect(result).toEqual({
        startYear: 2024,
        endYear: 2025,
        count: 5
      });
    });

    it('should handle invalid dates gracefully', () => {
      const examDates = [
        '2024-09-15',
        'invalid-date',
        '2024-10-20'
      ];
      const result = detectAcademicYearFromExams(examDates);
      expect(result).toEqual({
        startYear: 2024,
        endYear: 2025,
        count: 2
      });
    });
  });

  describe('getAcademicYearForMonth', () => {
    it('should return correct year for September-December (academic start year)', () => {
      expect(getAcademicYearForMonth(9, 2024)).toBe(2024);
      expect(getAcademicYearForMonth(10, 2024)).toBe(2024);
      expect(getAcademicYearForMonth(11, 2024)).toBe(2024);
      expect(getAcademicYearForMonth(12, 2024)).toBe(2024);
    });

    it('should return correct year for January-August (academic end year)', () => {
      expect(getAcademicYearForMonth(1, 2024)).toBe(2025);
      expect(getAcademicYearForMonth(2, 2024)).toBe(2025);
      expect(getAcademicYearForMonth(3, 2024)).toBe(2025);
      expect(getAcademicYearForMonth(4, 2024)).toBe(2025);
      expect(getAcademicYearForMonth(5, 2024)).toBe(2025);
      expect(getAcademicYearForMonth(6, 2024)).toBe(2025);
      expect(getAcademicYearForMonth(7, 2024)).toBe(2025);
      expect(getAcademicYearForMonth(8, 2024)).toBe(2025);
    });

    it('should fall back to current year logic when no academic start year provided', () => {
      const currentYear = new Date().getFullYear();
      
      // For months 9-12, should return previous year
      if (new Date().getMonth() + 1 >= 9) {
        expect(getAcademicYearForMonth(9)).toBe(currentYear - 1);
        expect(getAcademicYearForMonth(12)).toBe(currentYear - 1);
      } else {
        expect(getAcademicYearForMonth(9)).toBe(currentYear - 1);
        expect(getAcademicYearForMonth(12)).toBe(currentYear - 1);
      }
      
      // For months 1-8, should return current year
      expect(getAcademicYearForMonth(1)).toBe(currentYear);
      expect(getAcademicYearForMonth(8)).toBe(currentYear);
    });

    it('should handle edge cases', () => {
      expect(getAcademicYearForMonth(0, 2024)).toBe(2025); // Invalid month
      expect(getAcademicYearForMonth(13, 2024)).toBe(2025); // Invalid month
    });
  });

  describe('generateAcademicYearMonths', () => {
    it('should generate correct academic year months for 2024-2025', () => {
      const months = generateAcademicYearMonths(2024);
      
      expect(months).toHaveLength(12);
      
      // Check academic year order: Sep, Oct, Nov, Dec (2024) -> Jan, Feb, Mar, Apr, May, Jun, Jul, Aug (2025)
      expect(months[0]).toEqual({
        name: 'September',
        days: 30,
        startDay: expect.any(Number),
        monthNumber: 9,
        year: 2024
      });
      
      expect(months[1]).toEqual({
        name: 'October',
        days: 31,
        startDay: expect.any(Number),
        monthNumber: 10,
        year: 2024
      });
      
      expect(months[4]).toEqual({
        name: 'January',
        days: 31,
        startDay: expect.any(Number),
        monthNumber: 1,
        year: 2025
      });
      
      expect(months[11]).toEqual({
        name: 'August',
        days: 31,
        startDay: expect.any(Number),
        monthNumber: 8,
        year: 2025
      });
    });

    it('should generate correct academic year months for 2023-2024', () => {
      const months = generateAcademicYearMonths(2023);
      
      expect(months).toHaveLength(12);
      
      // Check that September 2023 is first
      expect(months[0].year).toBe(2023);
      expect(months[0].monthNumber).toBe(9);
      
      // Check that August 2024 is last
      expect(months[11].year).toBe(2024);
      expect(months[11].monthNumber).toBe(8);
    });

    it('should have correct month names in English locale', () => {
      const months = generateAcademicYearMonths(2024);
      
      const expectedNames = [
        'September', 'October', 'November', 'December',
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August'
      ];
      
      months.forEach((month, index) => {
        expect(month.name).toBe(expectedNames[index]);
      });
    });

    it('should have correct number of days for each month', () => {
      const months = generateAcademicYearMonths(2024);
      
      const expectedDays = [30, 31, 30, 31, 31, 28, 31, 30, 31, 30, 31, 31];
      
      months.forEach((month, index) => {
        expect(month.days).toBe(expectedDays[index]);
      });
    });

    it('should calculate correct start day for Monday-first format', () => {
      const months = generateAcademicYearMonths(2024);
      
      months.forEach(month => {
        expect(month.startDay).toBeGreaterThanOrEqual(0);
        expect(month.startDay).toBeLessThanOrEqual(6);
      });
    });

    it('should handle leap year correctly', () => {
      const months = generateAcademicYearMonths(2020); // 2020 was a leap year
      
      // February 2021 should have 28 days (not a leap year)
      const february = months.find(m => m.monthNumber === 2 && m.year === 2021);
      expect(february?.days).toBe(28);
    });
  });
}); 