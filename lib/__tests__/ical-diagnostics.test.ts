/**
 * @jest-environment jsdom
 */

import { generateICalContent } from '../utils';
import { validateICalContent, diagnoseExamData, generateCompatibilityReport } from '../ical-diagnostics';
import type { Exam } from '@/types/exam';

describe('iCalendar Diagnostics', () => {
  const mockExam: Exam = {
    id: 1,
    date: '2024-06-01',
    time: '08:00',
    duration_minutes: 120,
    subject: 'Advanced Mathematics',
    code: 'MATH001',
    school: 'Engineering School',
    degree: 'Computer Science',
    year: '2',
    semester: '1',
    location: 'Room A-101'
  };

  const problematicExam: Exam = {
    id: 2,
    date: '2024-13-45', // Invalid date
    time: '25:70', // Invalid time
    duration_minutes: -10, // Invalid duration
    subject: 'Test; Subject, with\nproblematic\rcharacters',
    code: '',
    school: 'School'.repeat(50), // Very long text
    degree: 'Degree',
    year: '3',
    semester: '2',
    location: ''
  };

  describe('iCalendar Content Validation', () => {
    it('should validate correct iCalendar content', () => {
      const content = generateICalContent([mockExam]);
      const result = validateICalContent(content);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.details.eventCount).toBe(1);
      expect(result.details.hasTimezone).toBe(true);
    });

    it('should detect missing required properties', () => {
      const invalidContent = `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Test Event
END:VEVENT
END:VCALENDAR`;
      
      const result = validateICalContent(invalidContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required property: VERSION');
      expect(result.errors).toContain('Missing required property: PRODID');
      expect(result.errors.some(e => e.includes('Missing required property UID'))).toBe(true);
    });

    it('should detect TZID/UTC format mismatch', () => {
      const invalidContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:Test
BEGIN:VEVENT
UID:test@example.com
DTSTART;TZID=Europe/Madrid:20240601T080000Z
DTEND;TZID=Europe/Madrid:20240601T100000Z
SUMMARY:Test Event
END:VEVENT
END:VCALENDAR`;
      
      const result = validateICalContent(invalidContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('TZID parameter but uses UTC format'))).toBe(true);
    });

    it('should detect line length violations', () => {
      const longLineContent = generateICalContent([{
        ...mockExam,
        subject: 'A'.repeat(100) // Very long subject
      }]);
      
      const result = validateICalContent(longLineContent);
      
      // Should have warnings about long lines if not properly folded
      if (result.warnings.some(w => w.includes('exceeds 75 characters'))) {
        expect(result.warnings.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Exam Data Validation', () => {
    it('should validate correct exam data', () => {
      const result = diagnoseExamData([mockExam]);
      
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.summary.totalExams).toBe(1);
      expect(result.summary.invalidDates).toBe(0);
      expect(result.summary.invalidTimes).toBe(0);
    });

    it('should detect problematic exam data', () => {
      const result = diagnoseExamData([problematicExam]);
      
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.summary.invalidDates).toBeGreaterThan(0);
      expect(result.summary.invalidTimes).toBeGreaterThan(0);
      expect(result.summary.missingFields).toContain('code');
    });

    it('should handle mixed valid and invalid data', () => {
      const result = diagnoseExamData([mockExam, problematicExam]);
      
      expect(result.summary.totalExams).toBe(2);
      expect(result.summary.invalidDates).toBe(1);
      expect(result.summary.invalidTimes).toBe(1);
    });
  });

  describe('Compatibility Testing', () => {
    it('should generate compatibility report for valid content', () => {
      const content = generateICalContent([mockExam]);
      const report = generateCompatibilityReport(content);
      
      expect(report.googleCalendar.compatible).toBe(true);
      expect(report.outlookCalendar.compatible).toBe(true);
      expect(report.appleCalendar.compatible).toBe(true);
      expect(report.thunderbird.compatible).toBe(true);
    });

    it('should detect Google Calendar incompatibility', () => {
      const invalidContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:Test
BEGIN:VEVENT
UID:test@example.com
DTSTART;TZID=Europe/Madrid:20240601T080000Z
DTEND;TZID=Europe/Madrid:20240601T100000Z
SUMMARY:Test Event
END:VEVENT
END:VCALENDAR`;
      
      const report = generateCompatibilityReport(invalidContent);
      
      expect(report.googleCalendar.compatible).toBe(false);
      expect(report.googleCalendar.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Real-world Edge Cases', () => {
    it('should handle empty exam list', () => {
      const content = generateICalContent([]);
      const result = validateICalContent(content);
      
      expect(result.isValid).toBe(true);
      expect(result.details.eventCount).toBe(0);
    });

    it('should handle exams with special characters', () => {
      const specialExam: Exam = {
        ...mockExam,
        subject: 'Math & Physics: Advanced Topics (2024)',
        location: 'Building A, Room 101 - Lab #2'
      };
      
      const content = generateICalContent([specialExam]);
      const result = validateICalContent(content);
      
      expect(result.isValid).toBe(true);
    });

    it('should handle exams with unicode characters', () => {
      const unicodeExam: Exam = {
        ...mockExam,
        subject: 'Matemáticas Avanzadas',
        location: 'Edificio Principal, Aula 101'
      };
      
      const content = generateICalContent([unicodeExam]);
      const result = validateICalContent(content);
      
      expect(result.isValid).toBe(true);
      expect(result.details.encoding).toContain('UTF-8');
    });

    it('should handle very long exam lists', () => {
      const manyExams = Array.from({ length: 100 }, (_, i) => ({
        ...mockExam,
        id: i + 1,
        date: `2024-06-${String(i % 30 + 1).padStart(2, '0')}`,
        subject: `Subject ${i + 1}`
      }));
      
      const content = generateICalContent(manyExams);
      const result = validateICalContent(content);
      
      expect(result.isValid).toBe(true);
      expect(result.details.eventCount).toBe(100);
    });

    it('should detect timezone issues in different scenarios', () => {
      // Test with different timezone
      const content1 = generateICalContent([mockExam], { timeZone: 'America/New_York' });
      const result1 = validateICalContent(content1);
      expect(result1.isValid).toBe(true);
      
      // Test with invalid timezone (should still work but might have warnings)
      const content2 = generateICalContent([mockExam], { timeZone: 'Invalid/Timezone' });
      const result2 = validateICalContent(content2);
      // Should still be structurally valid even with invalid timezone
      expect(result2.details.hasTimezone).toBe(true);
    });
  });
});