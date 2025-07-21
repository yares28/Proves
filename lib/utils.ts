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

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function formatICalDateLocal(date: Date): string {
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

export function escapeICalText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export function generateICalContent(
  exams: Exam[],
  options: ICalExportOptions = {}
): string {
  const { 
    calendarName = 'UPV Exams',
    reminderMinutes = [24 * 60, 60], // 1 day and 1 hour before
    timeZone = 'Europe/Madrid'
  } = options;

  const icalLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UPV Exam Calendar//EN',
    `X-WR-CALNAME:${calendarName}`,
    `X-WR-TIMEZONE:${timeZone}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  // Add timezone component for better compatibility
  icalLines.push(
    'BEGIN:VTIMEZONE',
    `TZID:${timeZone}`,
    'BEGIN:STANDARD',
    'DTSTART:20231029T030000',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'DTSTART:20240331T020000',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'END:DAYLIGHT',
    'END:VTIMEZONE'
  );

  exams.forEach(exam => {
    // Parse date and time
    const examDate = new Date(exam.date);
    const [hours, minutes] = exam.time.split(':').map(Number);
    
    // Set start time
    const startTime = new Date(examDate);
    startTime.setHours(hours, minutes, 0, 0);
    
    // Set end time using exam's duration_minutes
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + exam.duration_minutes);

    // Helper to format dates in local time for the specified timezone
    const formatDate = (date: Date) => formatICalDateLocal(date);

    // Create enhanced description with emoji
    const description = [
      `📚 Subject: ${exam.subject}`,
      `🔢 Code: ${exam.code}`,
      `🏫 School: ${exam.school}`,
      `🎓 Degree: ${exam.degree}`,
      `📅 Year: ${exam.year}`,
      `📖 Semester: ${exam.semester}`,
      exam.acronym ? `🏷️ Acronym: ${exam.acronym}` : '',
      '',
      '⏰ Duration: ' + exam.duration_minutes + ' minutes (' + Math.round((exam.duration_minutes / 60) * 10) / 10 + ' hours)',
      '📅 Exported from UPV Exam Calendar',
      '🕒 Export time: ' + new Date().toLocaleString()
    ]
      .filter(Boolean)
      .join('\\n');

    icalLines.push(
      'BEGIN:VEVENT',
      `UID:exam-${exam.id}-${exam.date}-${exam.time}@upv-exam-calendar.com`,
      `DTSTART;TZID=${timeZone}:${formatDate(startTime)}`,
      `DTEND;TZID=${timeZone}:${formatDate(endTime)}`,
      `SUMMARY:${escapeICalText('🎓 ' + exam.subject + ' - Exam')}`,
      `DESCRIPTION:${escapeICalText(description)}`,
      `LOCATION:${escapeICalText(exam.location || 'Location TBD')}`,
      `CREATED:${formatDate(new Date())}`,
      `LAST-MODIFIED:${formatDate(new Date())}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'CATEGORIES:EXAM,UNIVERSITY'
    );

    // Add reminders/alarms
    reminderMinutes.forEach(minutes => {
      const alarmTime = new Date(startTime);
      alarmTime.setMinutes(alarmTime.getMinutes() - minutes);
      
      icalLines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:Reminder: ${exam.subject} exam in ${minutes < 60 ? minutes + ' minutes' : Math.round(minutes / 60) + ' hour(s)'}`,
        `TRIGGER:-PT${minutes}M`,
        'END:VALARM'
      );
    });

    icalLines.push('END:VEVENT');
  });

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
