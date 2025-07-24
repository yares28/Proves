import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Exam } from "@/types/exam"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ICalExportOptions {
  calendarName?: string;
  reminderMinutes?: number[];
  timeZone?: string;
}

// Helper function to escape iCalendar text fields
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/;/g, '\\;')    // Escape semicolons
    .replace(/,/g, '\\,')    // Escape commas
    .replace(/\n/g, '\\n')   // Escape newlines
    .replace(/\r/g, '');     // Remove carriage returns
}

// Generate dynamic timezone component with accurate DST rules
function generateTimezoneComponent(timeZone: string): string[] {
  const currentYear = new Date().getFullYear();
  
  // For Europe/Madrid (CET/CEST)
  if (timeZone === 'Europe/Madrid') {
    // Calculate DST transitions for current year
    // Last Sunday in March (spring forward)
    const marchLastSunday = getLastSundayOfMonth(currentYear, 2); // March is month 2 (0-indexed)
    // Last Sunday in October (fall back)  
    const octoberLastSunday = getLastSundayOfMonth(currentYear, 9); // October is month 9
    
    return [
      'BEGIN:VTIMEZONE',
      `TZID:${timeZone}`,
      'BEGIN:STANDARD',
      `DTSTART:${formatTzDate(octoberLastSunday)}T030000`,
      'TZOFFSETFROM:+0200',
      'TZOFFSETTO:+0100',
      'TZNAME:CET',
      'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
      'END:STANDARD',
      'BEGIN:DAYLIGHT',
      `DTSTART:${formatTzDate(marchLastSunday)}T020000`,
      'TZOFFSETFROM:+0100',
      'TZOFFSETTO:+0200',
      'TZNAME:CEST',
      'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
      'END:DAYLIGHT',
      'END:VTIMEZONE'
    ];
  }
  
  // Fallback for other timezones - use basic definition
  return [
    'BEGIN:VTIMEZONE',
    `TZID:${timeZone}`,
    'BEGIN:STANDARD',
    'DTSTART:19701025T030000',
    'TZOFFSETFROM:+0000',
    'TZOFFSETTO:+0000',
    'TZNAME:STD',
    'END:STANDARD',
    'END:VTIMEZONE'
  ];
}

// Helper function to get last Sunday of a month
function getLastSundayOfMonth(year: number, month: number): Date {
  const lastDay = new Date(year, month + 1, 0); // Last day of the month
  const lastSunday = new Date(lastDay);
  lastSunday.setDate(lastDay.getDate() - lastDay.getDay()); // Go back to Sunday
  return lastSunday;
}

// Format date for timezone component
function formatTzDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// Robust timezone-aware date parsing
function parseExamDateTime(dateStr: string, timeStr: string, timeZone: string): { start: Date; isValid: boolean } {
  try {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{1,2}:\d{2}(?::\d{2})?$/; // Accept HH:mm or HH:mm:ss
    
    if (!dateRegex.test(dateStr) || !timeRegex.test(timeStr)) {
      return { start: new Date(), isValid: false };
    }
    // Parse components
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    // Validate ranges
    if (month < 1 || month > 12 || day < 1 || day > 31 || 
        hours < 0 || hours > 23 || minutes < 0 || minutes > 59 ||
        (seconds !== undefined && (seconds < 0 || seconds > 59))) {
      return { start: new Date(), isValid: false };
    }
    // Create date in local timezone first, then we'll format it correctly for iCal
    const examDate = new Date(year, month - 1, day, hours, minutes, seconds || 0, 0);
    // Validate the created date
    if (isNaN(examDate.getTime()) || 
        examDate.getFullYear() !== year ||
        examDate.getMonth() !== month - 1 ||
        examDate.getDate() !== day) {
      return { start: new Date(), isValid: false };
    }
    return { start: examDate, isValid: true };
  } catch (error) {
    return { start: new Date(), isValid: false };
  }
}

export function generateICalContent(exams: Exam[], options: ICalExportOptions = {}): string {
  const { 
    calendarName = 'UPV Exams',
    reminderMinutes = [24 * 60, 60], // 1 day and 1 hour before
    timeZone = 'Europe/Madrid'
  } = options;

  const icalLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UPV Exam Calendar//EN',
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
    `X-WR-TIMEZONE:${timeZone}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  // Add dynamic timezone component for better compatibility
  const timezoneLines = generateTimezoneComponent(timeZone);
  icalLines.push(...timezoneLines);

  // Filter out invalid exams and log issues
  const validExams: Exam[] = [];
  const invalidExams: { exam: Exam; reason: string }[] = [];

  exams.forEach(exam => {
    // Validate required fields
    if (!exam.date || !exam.time || !exam.duration_minutes || !exam.subject) {
      invalidExams.push({ exam, reason: 'Missing required fields' });
      return;
    }

    // Parse and validate date/time
    const parseResult = parseExamDateTime(exam.date, exam.time, timeZone);
    if (!parseResult.isValid) {
      invalidExams.push({ exam, reason: 'Invalid date/time format' });
      return;
    }

    validExams.push(exam);
  });

  // Log invalid exams for debugging (always, including production)
  if (invalidExams.length > 0) {
    console.error(`Skipped ${invalidExams.length} invalid exams:`, invalidExams);
  }

  validExams.forEach(exam => {
    // Use robust date parsing
    const parseResult = parseExamDateTime(exam.date, exam.time, timeZone);
    const startTime = parseResult.start;
    
    // Set end time using exam's duration_minutes
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + exam.duration_minutes);

    // Format dates for iCal - LOCAL TIME FORMAT (no Z suffix when using TZID)
    const formatICalLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      const second = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hour}${minute}${second}`;
    };

    // Format UTC dates for CREATED/LAST-MODIFIED (these should be UTC per RFC 5545)
    const formatICalUtcDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    };

    // Create enhanced description with proper escaping
    const description = escapeICalText([
      `Subject: ${exam.subject}`,
      `Code: ${exam.code}`,
      `School: ${exam.school}`,
      `Degree: ${exam.degree}`,
      `Year: ${exam.year}`,
      `Semester: ${exam.semester}`,
      exam.acronym ? `Acronym: ${exam.acronym}` : '',
      '',
      'Duration: ' + exam.duration_minutes + ' minutes (' + Math.round(exam.duration_minutes / 60 * 10) / 10 + ' hours)',
      'Exported from UPV Exam Calendar',
      'Export time: ' + new Date().toLocaleString()
    ].filter(Boolean).join('\n'));

    // Fold long lines to comply with RFC 5545 (max 75 octets per line)
    const foldLine = (line: string) => {
      if (line.length <= 75) return line;
      const folded = [];
      let start = 0;
      while (start < line.length) {
        if (start === 0) {
          folded.push(line.substring(0, 75));
          start = 75;
        } else {
          folded.push(' ' + line.substring(start, start + 74));
          start += 74;
        }
      }
      return folded.join('\r\n');
    };

    const now = new Date();
    
    icalLines.push(
      'BEGIN:VEVENT',
      `UID:exam-${exam.id}-${exam.date}-${exam.time}@upv-exam-calendar.com`,
      `DTSTART;TZID=${timeZone}:${formatICalLocalDate(startTime)}`,
      `DTEND;TZID=${timeZone}:${formatICalLocalDate(endTime)}`,
      foldLine(`SUMMARY:${escapeICalText(exam.subject + ' - Exam')}`),
      foldLine(`DESCRIPTION:${description}`),
      foldLine(`LOCATION:${escapeICalText(exam.location || 'Location TBD')}`),
      `CREATED:${formatICalUtcDate(now)}`,
      `LAST-MODIFIED:${formatICalUtcDate(now)}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'CATEGORIES:EXAM,UNIVERSITY'
    );

    // Add reminders/alarms
    reminderMinutes.forEach(minutes => {
      const reminderText = `Reminder: ${exam.subject} exam in ${minutes < 60 ? minutes + ' minutes' : Math.round(minutes / 60) + ' hour(s)'}`;
      icalLines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        foldLine(`DESCRIPTION:${escapeICalText(reminderText)}`),
        `TRIGGER:-PT${minutes}M`,
        'END:VALARM'
      );
    });

    icalLines.push('END:VEVENT');
  });

  // If no valid exams were processed, add a placeholder event to prevent infinite loading in Google Calendar
  if (validExams.length === 0) {
    console.warn('⚠️ No valid exams found - adding placeholder event to prevent Google Calendar infinite loading');
    
    const now = new Date();
    const placeholderStart = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const placeholderEnd = new Date(placeholderStart.getTime() + 60 * 60 * 1000); // 1 hour later
    
    const formatICalLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      const second = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hour}${minute}${second}`;
    };

    const formatICalUtcDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    };

    const foldLine = (line: string) => {
      if (line.length <= 75) return line;
      const folded = [];
      let start = 0;
      while (start < line.length) {
        if (start === 0) {
          folded.push(line.substring(0, 75));
          start = 75;
        } else {
          folded.push(' ' + line.substring(start, start + 74));
          start += 74;
        }
      }
      return folded.join('\r\n');
    };
    
    icalLines.push(
      'BEGIN:VEVENT',
      `UID:no-exams-${Date.now()}@upv-exam-calendar.com`,
      `DTSTART;TZID=${timeZone}:${formatICalLocalDate(placeholderStart)}`,
      `DTEND;TZID=${timeZone}:${formatICalLocalDate(placeholderEnd)}`,
      foldLine('SUMMARY:No Exams Found'),
      foldLine('DESCRIPTION:No exams match your current filters or there are no exams available. Please adjust your filters and try again, or check back later for new exam schedules.'),
      'LOCATION:',
      `CREATED:${formatICalUtcDate(now)}`,
      `LAST-MODIFIED:${formatICalUtcDate(now)}`,
      'STATUS:TENTATIVE',
      'TRANSP:TRANSPARENT',
      'CATEGORIES:INFO',
      'END:VEVENT'
    );
  }

  icalLines.push('END:VCALENDAR');
  return icalLines.join('\r\n');
}

export function downloadICalFile(content: string, filename: string = 'upv-exams.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export function generateGoogleCalendarUrl(exam: Exam): string {
  // Parse date and time
  const examDate = new Date(exam.date);
  const [hours, minutes] = exam.time.split(':').map(Number);
  
  // Set start time
  const startTime = new Date(examDate);
  startTime.setHours(hours, minutes, 0, 0);
  
  // Set end time using exam's duration_minutes
  const endTime = new Date(startTime);
  endTime.setMinutes(startTime.getMinutes() + exam.duration_minutes);

  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const title = encodeURIComponent(`${exam.subject} - Exam`);
  const details = encodeURIComponent([
    `Subject: ${exam.subject}`,
    `Code: ${exam.code}`,
    `School: ${exam.school}`,
    `Degree: ${exam.degree}`,
    `Year: ${exam.year}`,
    `Semester: ${exam.semester}`,
    exam.acronym ? `Acronym: ${exam.acronym}` : '',
    '',
    `Duration: ${exam.duration_minutes} minutes (${Math.round(exam.duration_minutes / 60 * 10) / 10} hours)`,
    'Added from UPV Exam Calendar'
  ].filter(Boolean).join('\n'));
  
  const location = encodeURIComponent(exam.location || 'Location TBD');
  const dates = `${formatGoogleDate(startTime)}/${formatGoogleDate(endTime)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}
