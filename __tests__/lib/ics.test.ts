import { buildIcs, parseIsoDurationToMinutes } from '@/lib/ics';
import type { Exam } from '@/types/exam';

describe('parseIsoDurationToMinutes', () => {
  it('parses common reminder offsets', () => {
    expect(parseIsoDurationToMinutes('-P1D')).toBe(1440);
    expect(parseIsoDurationToMinutes('-PT1H')).toBe(60);
    expect(parseIsoDurationToMinutes('-PT30M')).toBe(30);
    expect(parseIsoDurationToMinutes('-P1W')).toBe(10080);
    expect(parseIsoDurationToMinutes('P1DT2H')).toBe(1560);
  });

  it('returns null for unparseable input', () => {
    expect(parseIsoDurationToMinutes('')).toBeNull();
    expect(parseIsoDurationToMinutes('banana')).toBeNull();
    expect(parseIsoDurationToMinutes('P')).toBeNull();
  });
});

describe('buildIcs', () => {
  const exam: Exam = {
    id: 1,
    subject: 'Programación',
    code: '11604',
    acronym: 'PRG',
    date: '2026-01-15',
    time: '09:00',
    duration_minutes: 90,
    location: 'Aula 1',
    comment: 'parcial',
    school: 'ETSINF',
    degree: 'GIINF',
    year: '2',
    semester: 'A',
  };

  it('emits a valid VCALENDAR envelope', () => {
    const ics = buildIcs([exam], { name: 'Mis Exámenes' });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('METHOD:PUBLISH');
    expect(ics).toContain('X-WR-CALNAME:Mis Exámenes');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
  });

  it('converts local Valencia time to the correct UTC instant (winter = UTC+1)', () => {
    const ics = buildIcs([exam]);
    // 09:00 CET -> 08:00 UTC; +90min -> 09:30 UTC
    expect(ics).toContain('DTSTART:20260115T080000Z');
    expect(ics).toContain('DTEND:20260115T093000Z');
  });

  it('renders reminders as VALARM triggers in minutes', () => {
    const ics = buildIcs([exam], { reminderMinutes: [1440, 60] });
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('TRIGGER:-PT1440M');
    expect(ics).toContain('TRIGGER:-PT60M');
  });

  it('escapes RFC-5545 special characters in text', () => {
    const ics = buildIcs([{ ...exam, subject: 'A, B; C' }]);
    expect(ics).toContain('SUMMARY:A\\, B\\; C (PRG)');
  });

  it('produces an all-day event when no time is present', () => {
    const ics = buildIcs([{ ...exam, time: '' }]);
    expect(ics).toContain('DTSTART;VALUE=DATE:20260115');
    expect(ics).toContain('DTEND;VALUE=DATE:20260116');
  });

  it('still returns a valid calendar when there are no exams', () => {
    const ics = buildIcs([]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).not.toContain('BEGIN:VEVENT');
  });
});
