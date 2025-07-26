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

    it('should generate placeholder event for empty exam list to prevent Google Calendar infinite loading', () => {
      const icalContent = generateICalContent([]);
      
      // Should still have valid calendar structure
      expect(icalContent).toMatch(/BEGIN:VCALENDAR/);
      expect(icalContent).toMatch(/END:VCALENDAR/);
      
      // Should contain a placeholder event
      expect(icalContent).toMatch(/BEGIN:VEVENT/);
      expect(icalContent).toMatch(/END:VEVENT/);
      expect(icalContent).toMatch(/SUMMARY:No Exams Found/);
      expect(icalContent).toMatch(/DESCRIPTION:No exams match your current filters/);
      expect(icalContent).toMatch(/STATUS:TENTATIVE/);
      expect(icalContent).toMatch(/TRANSP:TRANSPARENT/);
      expect(icalContent).toMatch(/CATEGORIES:INFO/);
      
      // Should have proper UID format
      expect(icalContent).toMatch(/UID:no-exams-\d+@upv-exam-calendar\.com/);
      
      // Should have proper timezone format (no Z suffix with TZID)
      const lines = icalContent.split('\r\n');
      const dtstartLine = lines.find(line => line.startsWith('DTSTART;TZID='));
      const dtendLine = lines.find(line => line.startsWith('DTEND;TZID='));
      
      expect(dtstartLine).toBeDefined();
      expect(dtendLine).toBeDefined();
      
      const startTime = dtstartLine!.split(':')[1];
      const endTime = dtendLine!.split(':')[1];
      
      expect(startTime).not.toMatch(/Z$/);
      expect(endTime).not.toMatch(/Z$/);
      expect(startTime).toMatch(/^\d{8}T\d{6}$/);
      expect(endTime).toMatch(/^\d{8}T\d{6}$/);
    });
  });
});

describe('Location and Comment Handling', () => {
  const baseExam: Exam = {
    id: 'test-1',
    date: '2024-03-15',
    time: '10:00',
    duration_minutes: 120,
    subject: 'Test Subject',
    code: '12345',
    location: '',
    comment: '',
    year: '1',
    semester: 'A',
    school: 'ETSINF',
    degree: 'Test Degree',
    acronym: 'TS'
  };

  it('should handle exam with both place and comment correctly', () => {
    const exam = {
      ...baseExam,
      location: '1G 0.1, 1G 0.2, 1G 0.4',
      comment: 'Primer parcial'
    };

    const icalContent = generateICalContent([exam], { useUPVFormat: true });
    
    // Should have place in location field (without comma escaping)
    expect(icalContent).toContain('LOCATION:1G 0.1, 1G 0.2, 1G 0.4');
    // Should have subject and comment in description
    expect(icalContent).toMatch(/DESCRIPTION:Test Subject - Primer parcial/);
    // Should not duplicate comment in location unless it contains location keywords
    expect(icalContent).not.toContain('LOCATION:1G 0.1, 1G 0.2, 1G 0.4 - Primer parcial');
  });

  it('should handle exam with only comment (no place) correctly', () => {
    const exam = {
      ...baseExam,
      location: '',
      comment: 'Parcial 1: prácticas: 1h+15 min descanso+ Parcial 1 teoría: 1h 30\''
    };

    const icalContent = generateICalContent([exam], { useUPVFormat: true });
    
    // Location should be empty when no place is provided
    expect(icalContent).toMatch(/LOCATION:\s*$/m);
    // Should have subject and comment in description (may be line-folded)
    expect(icalContent).toMatch(/DESCRIPTION:Test Subject - Parcial 1: prácticas/);
    // Should NOT put comment in location field
    expect(icalContent).not.toContain('LOCATION:Parcial 1: prácticas');
  });

  it('should handle exam with only place (no comment) correctly', () => {
    const exam = {
      ...baseExam,
      location: '1G 0.1, 1G 0.2',
      comment: ''
    };

    const icalContent = generateICalContent([exam], { useUPVFormat: true });
    
    // Should have place in location field (without comma escaping)
    expect(icalContent).toContain('LOCATION:1G 0.1, 1G 0.2');
    // Should have only subject in description (no comment)
    expect(icalContent).toMatch(/DESCRIPTION:Test Subject\s*$/m);
    expect(icalContent).not.toContain('DESCRIPTION:Test Subject -');
  });

  it('should handle exam with neither place nor comment', () => {
    const exam = {
      ...baseExam,
      location: '',
      comment: ''
    };

    const icalContent = generateICalContent([exam], { useUPVFormat: true });
    
    // Location should be empty
    expect(icalContent).toMatch(/LOCATION:\s*$/m);
    // Should have only subject in description
    expect(icalContent).toMatch(/DESCRIPTION:Test Subject\s*$/m);
    expect(icalContent).not.toContain('DESCRIPTION:Test Subject -');
  });

  it('should combine place and comment when comment contains location keywords', () => {
    const exam = {
      ...baseExam,
      location: 'Edificio 1G',
      comment: 'Aula 0.1 - Examen parcial'
    };

    const icalContent = generateICalContent([exam], { useUPVFormat: true });
    
    // Should combine place and location-specific comment
    expect(icalContent).toContain('LOCATION:Edificio 1G - Aula 0.1 - Examen parcial');
    // Should still have both in description
    expect(icalContent).toContain('DESCRIPTION:Test Subject - Aula 0.1 - Examen parcial');
  });

  it('should handle whitespace-only location and comment fields', () => {
    const exam = {
      ...baseExam,
      location: '   ',
      comment: '  \t  '
    };

    const icalContent = generateICalContent([exam], { useUPVFormat: true });
    
    // Should treat whitespace-only as empty
    expect(icalContent).toMatch(/LOCATION:\s*$/m);
    expect(icalContent).toMatch(/DESCRIPTION:Test Subject\s*$/m);
    expect(icalContent).not.toContain('DESCRIPTION:Test Subject -');
  });

  it('should work correctly with regular (non-UPV) format', () => {
    const exam = {
      ...baseExam,
      location: '1G 0.1',
      comment: 'Test comment'
    };

    const icalContent = generateICalContent([exam], { useUPVFormat: false });
    
    // Regular format should just use location as-is
    expect(icalContent).toContain('LOCATION:1G 0.1');
    // Should have comment in description
    expect(icalContent).toContain('DESCRIPTION:Test comment');
  });
});