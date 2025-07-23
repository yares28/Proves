/**
 * @jest-environment jsdom
 */

import { generateICalContent } from '../utils';
import type { Exam } from '@/types/exam';

describe('iCalendar Generation', () => {
  const mockExam: Exam = {
    id: 1,
    date: '2024-06-01',
    time: '08:00',
    duration_minutes: 120,
    subject: 'Advanced Mathematics; Test, Subject',
    code: 'MATH001',
    school: 'Engineering School',
    degree: 'Computer Science',
    year: 2,
    semester: 1,
    acronym: 'ADVMATH',
    location: 'Room A-101, Building B'
  };

  describe('Timezone Handling', () => {
    it('should generate DTSTART/DTEND without Z suffix when using TZID', () => {
      const icalContent = generateICalContent([mockExam], {
        timeZone: 'Europe/Madrid'
      });

      const lines = icalContent.split('\r\n');
      // Find DTSTART/DTEND lines that have TZID parameter (from VEVENT, not VTIMEZONE)
      const dtstartLine = lines.find(line => line.startsWith('DTSTART;TZID='));
      const dtendLine = lines.find(line => line.startsWith('DTEND;TZID='));

      expect(dtstartLine).toBeDefined();
      expect(dtendLine).toBeDefined();
      
      // Should have TZID parameter
      expect(dtstartLine).toMatch(/DTSTART;TZID=Europe\/Madrid:/);
      expect(dtendLine).toMatch(/DTEND;TZID=Europe\/Madrid:/);
      
      // Should NOT have Z suffix in the time value
      const timeValueStart = dtstartLine!.split(':')[1];
      const timeValueEnd = dtendLine!.split(':')[1];
      
      expect(timeValueStart).not.toMatch(/Z$/);
      expect(timeValueEnd).not.toMatch(/Z$/);
      
      // Should have correct local time format
      expect(timeValueStart).toMatch(/^\d{8}T\d{6}$/);
      expect(timeValueEnd).toMatch(/^\d{8}T\d{6}$/);
    });

    it('should generate correct local time values', () => {
      const icalContent = generateICalContent([mockExam], {
        timeZone: 'Europe/Madrid'
      });

      const lines = icalContent.split('\r\n');
      // Find DTSTART/DTEND lines that have TZID parameter (from VEVENT, not VTIMEZONE)
      const dtstartLine = lines.find(line => line.startsWith('DTSTART;TZID='));
      const dtendLine = lines.find(line => line.startsWith('DTEND;TZID='));

      // Extract time values
      const startTime = dtstartLine!.split(':')[1];
      const endTime = dtendLine!.split(':')[1];

      // Should be 08:00 (start) and 10:00 (end, +2 hours)
      expect(startTime).toBe('20240601T080000');
      expect(endTime).toBe('20240601T100000');
    });
  });

  describe('Text Escaping', () => {
    it('should properly escape semicolons in text fields', () => {
      const icalContent = generateICalContent([mockExam]);
      
      // Subject contains semicolon, should be escaped
      expect(icalContent).toMatch(/SUMMARY:Advanced Mathematics\\; Test\\, Subject - Exam/);
    });

    it('should properly escape commas in text fields', () => {
      const icalContent = generateICalContent([mockExam]);
      
      // Location contains comma, should be escaped
      expect(icalContent).toMatch(/LOCATION:Room A-101\\, Building B/);
    });

    it('should handle calendar name escaping', () => {
      const icalContent = generateICalContent([mockExam], {
        calendarName: 'Test; Calendar, Name'
      });
      
      expect(icalContent).toMatch(/X-WR-CALNAME:Test\\; Calendar\\, Name/);
    });
  });

  describe('iCalendar Structure', () => {
    it('should generate valid iCalendar structure', () => {
      const icalContent = generateICalContent([mockExam]);
      const lines = icalContent.split('\r\n');

      // Check basic structure
      expect(lines[0]).toBe('BEGIN:VCALENDAR');
      expect(lines[lines.length - 1]).toBe('END:VCALENDAR');
      
      // Check required properties
      expect(icalContent).toMatch(/VERSION:2\.0/);
      expect(icalContent).toMatch(/PRODID:-\/\/UPV Exam Calendar\/\/EN/);
      expect(icalContent).toMatch(/CALSCALE:GREGORIAN/);
      expect(icalContent).toMatch(/METHOD:PUBLISH/);
    });

    it('should include timezone component', () => {
      const icalContent = generateICalContent([mockExam], {
        timeZone: 'Europe/Madrid'
      });

      expect(icalContent).toMatch(/BEGIN:VTIMEZONE/);
      expect(icalContent).toMatch(/TZID:Europe\/Madrid/);
      expect(icalContent).toMatch(/END:VTIMEZONE/);
    });

    it('should generate complete event structure', () => {
      const icalContent = generateICalContent([mockExam]);

      expect(icalContent).toMatch(/BEGIN:VEVENT/);
      expect(icalContent).toMatch(/END:VEVENT/);
      expect(icalContent).toMatch(/UID:exam-1-2024-06-01-08:00@upv-exam-calendar\.com/);
      expect(icalContent).toMatch(/SUMMARY:/);
      expect(icalContent).toMatch(/DESCRIPTION:/);
      expect(icalContent).toMatch(/LOCATION:/);
      expect(icalContent).toMatch(/CREATED:/);
      expect(icalContent).toMatch(/LAST-MODIFIED:/);
    });
  });

  describe('Reminders/Alarms', () => {
    it('should generate alarms with proper escaping', () => {
      const examWithSpecialChars: Exam = {
        ...mockExam,
        subject: 'Math; Test, Subject'
      };

      const icalContent = generateICalContent([examWithSpecialChars], {
        reminderMinutes: [60]
      });

      expect(icalContent).toMatch(/BEGIN:VALARM/);
      expect(icalContent).toMatch(/ACTION:DISPLAY/);
      expect(icalContent).toMatch(/DESCRIPTION:Reminder: Math\\; Test\\, Subject exam in 1 hour\(s\)/);
      expect(icalContent).toMatch(/TRIGGER:-PT60M/);
      expect(icalContent).toMatch(/END:VALARM/);
    });
  });

  describe('Multiple Exams', () => {
    it('should generate multiple events correctly', () => {
      const exam2: Exam = {
        ...mockExam,
        id: 2,
        date: '2024-06-02',
        time: '14:30',
        subject: 'Physics'
      };

      const icalContent = generateICalContent([mockExam, exam2]);
      const eventCount = (icalContent.match(/BEGIN:VEVENT/g) || []).length;

      expect(eventCount).toBe(2);
      expect(icalContent).toMatch(/UID:exam-1-2024-06-01-08:00@upv-exam-calendar\.com/);
      expect(icalContent).toMatch(/UID:exam-2-2024-06-02-14:30@upv-exam-calendar\.com/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty location', () => {
      const examWithoutLocation: Exam = {
        ...mockExam,
        location: undefined
      };

      const icalContent = generateICalContent([examWithoutLocation]);
      expect(icalContent).toMatch(/LOCATION:Location TBD/);
    });

    it('should handle exam without acronym', () => {
      const examWithoutAcronym: Exam = {
        ...mockExam,
        acronym: undefined
      };

      const icalContent = generateICalContent([examWithoutAcronym]);
      // Should not include acronym line in description
      expect(icalContent).not.toMatch(/Acronym: undefined/);
    });

    it('should handle different duration formats', () => {
      const shortExam: Exam = {
        ...mockExam,
        duration_minutes: 90
      };

      const icalContent = generateICalContent([shortExam]);
      const lines = icalContent.split('\r\n');
      const dtendLine = lines.find(line => line.startsWith('DTEND'));
      const endTime = dtendLine!.split(':')[1];

      // Should be 09:30 (08:00 + 90 minutes)
      expect(endTime).toBe('20240601T093000');
    });
  });
});