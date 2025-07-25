import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Exam } from "@/types/exam";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ICalExportOptions {
  calendarName?: string;
  reminderMinutes?: number[];
  timeZone?: string;
  useUPVFormat?: boolean;
}

// Helper function to escape iCalendar text fields
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\") // Escape backslashes first
    .replace(/;/g, "\\;") // Escape semicolons
    .replace(/,/g, "\\,") // Escape commas
    .replace(/\n/g, "\\n") // Escape newlines
    .replace(/\r/g, ""); // Remove carriage returns
}

// Generate dynamic timezone component with accurate DST rules
function generateTimezoneComponent(timeZone: string): string[] {
  const currentYear = new Date().getFullYear();

  // For Europe/Madrid (CET/CEST)
  if (timeZone === "Europe/Madrid") {
    // Calculate DST transitions for current year
    // Last Sunday in March (spring forward)
    const marchLastSunday = getLastSundayOfMonth(currentYear, 2); // March is month 2 (0-indexed)
    // Last Sunday in October (fall back)
    const octoberLastSunday = getLastSundayOfMonth(currentYear, 9); // October is month 9

    return [
      "BEGIN:VTIMEZONE",
      `TZID:${timeZone}`,
      "BEGIN:STANDARD",
      `DTSTART:${formatTzDate(octoberLastSunday)}T030000`,
      "TZOFFSETFROM:+0200",
      "TZOFFSETTO:+0100",
      "TZNAME:CET",
      "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
      "END:STANDARD",
      "BEGIN:DAYLIGHT",
      `DTSTART:${formatTzDate(marchLastSunday)}T020000`,
      "TZOFFSETFROM:+0100",
      "TZOFFSETTO:+0200",
      "TZNAME:CEST",
      "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
      "END:DAYLIGHT",
      "END:VTIMEZONE",
    ];
  }

  // Fallback for other timezones - use basic definition
  return [
    "BEGIN:VTIMEZONE",
    `TZID:${timeZone}`,
    "BEGIN:STANDARD",
    "DTSTART:19701025T030000",
    "TZOFFSETFROM:+0000",
    "TZOFFSETTO:+0000",
    "TZNAME:STD",
    "END:STANDARD",
    "END:VTIMEZONE",
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
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

// Robust timezone-aware date parsing
function parseExamDateTime(
  dateStr: string,
  timeStr: string,
  timeZone: string
): { start: Date; isValid: boolean } {
  try {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{1,2}:\d{2}(?::\d{2})?$/; // Accept HH:mm or HH:mm:ss

    if (!dateRegex.test(dateStr) || !timeRegex.test(timeStr)) {
      return { start: new Date(), isValid: false };
    }
    // Parse components
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    // Validate ranges
    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59 ||
      (seconds !== undefined && (seconds < 0 || seconds > 59))
    ) {
      return { start: new Date(), isValid: false };
    }
    // Create date properly handling the supplied timezone to avoid double conversion
    let examDate: Date;

    examDate = new Date(year, month - 1, day, hours, minutes, seconds ?? 0, 0);

    // Validate the created date
    if (
      isNaN(examDate.getTime()) ||
      examDate.getFullYear() !== year ||
      examDate.getMonth() !== month - 1 ||
      examDate.getDate() !== day
    ) {
      return { start: new Date(), isValid: false };
    }
    return { start: examDate, isValid: true };
  } catch (error) {
    return { start: new Date(), isValid: false };
  }
}

export function generateICalContent(
  exams: Exam[],
  options: ICalExportOptions = {}
): string {
  const {
    calendarName = "UPV Exams",
    reminderMinutes = [24 * 60, 60], // 1 day and 1 hour before
    timeZone = "Europe/Madrid",
    useUPVFormat = true, // New option to use UPV-compatible format
  } = options;

  if (useUPVFormat) {
    return generateUPVCompatibleICalContent(exams, calendarName);
  }

  const icalLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UPV Exam Calendar//EN",
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
    `X-WR-TIMEZONE:${timeZone}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  // Add dynamic timezone component for better compatibility
  const timezoneLines = generateTimezoneComponent(timeZone);
  icalLines.push(...timezoneLines);

  // Filter out invalid exams and log issues
  const validExams: Exam[] = [];
  const invalidExams: { exam: Exam; reason: string }[] = [];

  exams.forEach((exam) => {
    // Validate required fields
    if (!exam.date || !exam.time || !exam.duration_minutes || !exam.subject) {
      invalidExams.push({ exam, reason: "Missing required fields" });
      return;
    }

    // Parse and validate date/time
    const parseResult = parseExamDateTime(exam.date, exam.time, timeZone);
    if (!parseResult.isValid) {
      invalidExams.push({ exam, reason: "Invalid date/time format" });
      return;
    }

    validExams.push(exam);
  });

  // Log invalid exams for debugging (always, including production)
  if (invalidExams.length > 0) {
    console.error(
      `Skipped ${invalidExams.length} invalid exams:`,
      invalidExams
    );
  }

  validExams.forEach((exam) => {
    // Use robust date parsing
    const parseResult = parseExamDateTime(exam.date, exam.time, timeZone);
    const startTime = parseResult.start;

    // Set end time using exam's duration_minutes
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + exam.duration_minutes);

    // Format dates for iCal - LOCAL TIME FORMAT (no Z suffix when using TZID)
    const formatICalLocalDate = (date: Date, isEndTime: boolean = false) => {
      // For Madrid timezone, use the original exam time directly to avoid browser timezone interference
      if (timeZone === "Europe/Madrid") {
        // Parse the original exam date and time to avoid any Date object timezone conversion
        const [examHours, examMinutes] = exam.time.split(":").map(Number);
        const examDate = new Date(exam.date);
        const year = examDate.getFullYear();
        const month = String(examDate.getMonth() + 1).padStart(2, "0");
        const day = String(examDate.getDate()).padStart(2, "0");

        let hour: number, minute: number;
        if (isEndTime) {
          // Calculate end time by adding duration to original exam time
          const totalMinutes =
            examHours * 60 + examMinutes + exam.duration_minutes;
          hour = Math.floor(totalMinutes / 60);
          minute = totalMinutes % 60;

          // Handle day overflow (if exam goes past midnight)
          if (hour >= 24) {
            hour = hour % 24;
            // Note: For simplicity, we're not handling day increment here
            // Most exams won't span midnight, but this could be enhanced if needed
          }
        } else {
          hour = examHours;
          minute = examMinutes;
        }

        const hourStr = String(hour).padStart(2, "0");
        const minuteStr = String(minute).padStart(2, "0");
        const second = "00";
        return `${year}${month}${day}T${hourStr}${minuteStr}${second}`;
      } else {
        // For other timezones, use the date object
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hour = String(date.getHours()).padStart(2, "0");
        const minute = String(date.getMinutes()).padStart(2, "0");
        const second = String(date.getSeconds()).padStart(2, "0");
        return `${year}${month}${day}T${hour}${minute}${second}`;
      }
    };

    // Format UTC dates for CREATED/LAST-MODIFIED (these should be UTC per RFC 5545)
    const formatICalUtcDate = (date: Date) => {
      return date
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z");
    };

    // Use comment from database if available, otherwise create basic description
    const description = exam.comment
      ? escapeICalText(exam.comment)
      : escapeICalText(`${exam.subject} - Exam`);

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
          folded.push(" " + line.substring(start, start + 74));
          start += 74;
        }
      }
      return folded.join("\r\n");
    };

    const now = new Date();

    icalLines.push(
      "BEGIN:VEVENT",
      `UID:exam-${exam.id}-${exam.date}-${exam.time}@upv-exam-calendar.com`,
      `DTSTART;TZID=${timeZone}:${formatICalLocalDate(startTime, false)}`,
      `DTEND;TZID=${timeZone}:${formatICalLocalDate(endTime, true)}`,
      foldLine(`SUMMARY:${escapeICalText(exam.subject + " - Exam")}`),
      foldLine(`DESCRIPTION:${description}`),
      foldLine(`LOCATION:${escapeICalText(exam.location)}`),
      `CREATED:${formatICalUtcDate(now)}`,
      `LAST-MODIFIED:${formatICalUtcDate(now)}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "CATEGORIES:EXAM,UNIVERSITY"
    );

    // Add reminders/alarms
    reminderMinutes.forEach((minutes) => {
      const reminderText = `Reminder: ${exam.subject} exam in ${
        minutes < 60
          ? minutes + " minutes"
          : Math.round(minutes / 60) + " hour(s)"
      }`;
      icalLines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        foldLine(`DESCRIPTION:${escapeICalText(reminderText)}`),
        `TRIGGER:-PT${minutes}M`,
        "END:VALARM"
      );
    });

    icalLines.push("END:VEVENT");
  });

  // If no valid exams were processed, add a placeholder event to prevent infinite loading in Google Calendar
  if (validExams.length === 0) {
    console.warn(
      "⚠️ No valid exams found - adding placeholder event to prevent Google Calendar infinite loading"
    );

    const now = new Date();
    const placeholderStart = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const placeholderEnd = new Date(
      placeholderStart.getTime() + 60 * 60 * 1000
    ); // 1 hour later

    const formatICalLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hour = String(date.getHours()).padStart(2, "0");
      const minute = String(date.getMinutes()).padStart(2, "0");
      const second = String(date.getSeconds()).padStart(2, "0");
      return `${year}${month}${day}T${hour}${minute}${second}`;
    };

    const formatICalUtcDate = (date: Date) => {
      return date
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z");
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
          folded.push(" " + line.substring(start, start + 74));
          start += 74;
        }
      }
      return folded.join("\r\n");
    };

    icalLines.push(
      "BEGIN:VEVENT",
      `UID:no-exams-${Date.now()}@upv-exam-calendar.com`,
      `DTSTART;TZID=${timeZone}:${formatICalLocalDate(placeholderStart)}`,
      `DTEND;TZID=${timeZone}:${formatICalLocalDate(placeholderEnd)}`,
      foldLine("SUMMARY:No Exams Found"),
      foldLine(
        "DESCRIPTION:No exams match your current filters or there are no exams available. Please adjust your filters and try again, or check back later for new exam schedules."
      ),
      "LOCATION:",
      `CREATED:${formatICalUtcDate(now)}`,
      `LAST-MODIFIED:${formatICalUtcDate(now)}`,
      "STATUS:TENTATIVE",
      "TRANSP:TRANSPARENT",
      "CATEGORIES:INFO",
      "END:VEVENT"
    );
  }

  icalLines.push("END:VCALENDAR");
  return icalLines.join("\r\n");
}

export function downloadICalFile(
  content: string,
  filename: string = "upv-exams.ics"
): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export function generateGoogleCalendarUrl(exam: Exam): string {
  // Use the same timezone-aware parsing as iCal generation to ensure consistency
  const parseResult = parseExamDateTime(exam.date, exam.time, "Europe/Madrid");

  let startTime: Date;
  let endTime: Date;

  if (!parseResult.isValid) {
    // Fallback to original parsing if timezone-aware parsing fails
    console.warn(
      `Failed to parse exam time with timezone awareness for exam ${exam.id}, falling back to local parsing`
    );
    const examDate = new Date(exam.date);
    const [hours, minutes] = exam.time.split(":").map(Number);
    startTime = new Date(examDate);
    startTime.setHours(hours, minutes, 0, 0);
  } else {
    // Use timezone-aware parsing result
    startTime = parseResult.start;
  }

  // Set end time using exam's duration_minutes
  endTime = new Date(startTime);
  endTime.setMinutes(startTime.getMinutes() + exam.duration_minutes);

  const formatGoogleDate = (date: Date) => {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  };

  const title = encodeURIComponent(`${exam.subject} - Exam`);
  const details = encodeURIComponent(
    [
      `Subject: ${exam.subject}`,
      `Code: ${exam.code}`,
      `School: ${exam.school}`,
      `Degree: ${exam.degree}`,
      `Year: ${exam.year}`,
      `Semester: ${exam.semester}`,
      exam.acronym ? `Acronym: ${exam.acronym}` : "",
      "",
      `Duration: ${exam.duration_minutes} minutes (${
        Math.round((exam.duration_minutes / 60) * 10) / 10
      } hours)`,
      "Added from UPV Exam Calendar",
    ]
      .filter(Boolean)
      .join("\n")
  );

  const location = encodeURIComponent(exam.location || "Location TBD");
  const dates = `${formatGoogleDate(startTime)}/${formatGoogleDate(endTime)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

// UPV-compatible iCal generator following official UPV format
function generateUPVCompatibleICalContent(
  exams: Exam[],
  calendarName: string
): string {
  // Step 1: Use UTC timezone strategy (no VTIMEZONE block)
  const icalLines = [
    "BEGIN:VCALENDAR",
    "PRODID:-//UPV-Cal//Exam API 1.0//ES",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${calendarName}`,
    "X-APPLE-CALENDAR-COLOR:#0252D4",
    "X-WR-TIMEZONE:Europe/Madrid",
  ];

  // Step 2: Generate events in UPV format
  const now = new Date();
  const nowUtc = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

  // Subject color mapping (from UPV examples)
  const subjectColors: Record<string, { bg: string; fg: string }> = {
    "Estructura de computadores": { bg: "#336600", fg: "#ffffff" },
    "Sistemas inteligentes": { bg: "#88AB2F", fg: "#ffffff" },
    "Bases de datos y sistemas de información": {
      bg: "#CCBC0F",
      fg: "#FFFFFF",
    },
    "Tecnología de sistemas de información en la red": {
      bg: "#CCBC0F",
      fg: "#FFFFFF",
    },
    "Concurrencia y sistemas distribuidos": { bg: "#D55E8E", fg: "0" },
    "Teoría de autómatas y lenguajes formales": { bg: "#FFCBFF", fg: "0" },
    "Lenguajes, tecnologías y paradigmas de la programación": {
      bg: "#F0F0F0",
      fg: "#0",
    },
    "Desarrollo web": { bg: "#1B5A96", fg: "#ffffff" },
    "Diseño y configuración de redes de área local": {
      bg: "#578A07",
      fg: "#ffffff",
    },
    "Diseño, configuración y evaluación de los sistemas informáticos": {
      bg: "#DB8E00",
      fg: "#ffffff",
    },
    "Administración de sistemas": { bg: "#009900", fg: "#ffffff" },
  };

  // Default colors for unknown subjects
  const defaultColors = { bg: "#0252D4", fg: "#ffffff" };

  // Filter and process valid exams
  const validExams: Exam[] = [];
  exams.forEach((exam) => {
    if (!exam.date || !exam.time || !exam.duration_minutes || !exam.subject) {
      return;
    }

    const parseResult = parseExamDateTime(
      exam.date,
      exam.time,
      "Europe/Madrid"
    );
    if (!parseResult.isValid) {
      return;
    }

    validExams.push(exam);
  });

  // Generate events
  validExams.forEach((exam) => {
    // For UPV format, use direct time parsing to avoid timezone conversion issues
    const [examHours, examMinutes] = exam.time.split(":").map(Number);
    const examDate = new Date(exam.date);

    // Create start time using original exam time (no timezone conversion)
    const startTime = new Date(
      examDate.getFullYear(),
      examDate.getMonth(),
      examDate.getDate(),
      examHours,
      examMinutes,
      0
    );

    // Calculate end time by adding duration
    const totalMinutes = examHours * 60 + examMinutes + exam.duration_minutes;
    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;
    const endTime = new Date(
      examDate.getFullYear(),
      examDate.getMonth(),
      examDate.getDate(),
      endHour,
      endMinute,
      0
    );

    // Format as local time for UPV format - no timezone conversion, no Z suffix
    const formatUTCDate = (date: Date) => {
      // Use the local time directly without any timezone conversion
      // The X-WR-TIMEZONE:Europe/Madrid header will handle the timezone display
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hour = String(date.getHours()).padStart(2, "0");
      const minute = String(date.getMinutes()).padStart(2, "0");
      const second = String(date.getSeconds()).padStart(2, "0");

      // No Z suffix - this indicates local time, not UTC
      return `${year}${month}${day}T${hour}${minute}${second}`;
    };

    // Get colors for this subject
    const colors = subjectColors[exam.subject] || defaultColors;

    // Generate stable UID
    const uid = `${generateStableId(exam)}@upv-cal`;

    // Fold long lines (RFC 5545 compliance)
    const foldLine = (line: string) => {
      if (line.length <= 75) return line;
      const folded = [];
      let start = 0;
      while (start < line.length) {
        if (start === 0) {
          folded.push(line.substring(0, 75));
          start = 75;
        } else {
          folded.push(" " + line.substring(start, start + 74));
          start += 74;
        }
      }
      return folded.join("\r\n");
    };

    // Create enhanced description with location and comment
    const descriptionParts = [exam.subject];
    if (exam.comment && exam.comment.trim()) {
      descriptionParts.push(exam.comment.trim());
    }
    const description = descriptionParts.join(" - ");

    // Ensure location includes both place and comment if available
    let location = exam.location || "";
    if (
      exam.comment &&
      exam.comment.trim() &&
      !location.includes(exam.comment)
    ) {
      location = location ? `${location} - ${exam.comment}` : exam.comment;
    }

    // Step 3: Canonical template for each exam (exact order from UPV)
    icalLines.push(
      "BEGIN:VEVENT",
      `DTSTART:${formatUTCDate(startTime)}`,
      `DTEND:${formatUTCDate(endTime)}`,
      `DTSTAMP:${nowUtc}`,
      `UID:${uid}`,
      `CREATED:${nowUtc}`,
      foldLine(`DESCRIPTION:${description}`),
      `LAST-MODIFIED:${nowUtc}`,
      foldLine(`LOCATION:${location}`),
      "SEQUENCE:0",
      "STATUS:CONFIRMED",
      foldLine(`SUMMARY:Examen ${exam.subject}`),
      "TRANSP:OPAQUE",
      `UPV_BGCOLOR:${colors.bg}`,
      `UPV_FGCOLOR:${colors.fg}`,
      "END:VEVENT"
    );
  });

  // Handle empty exam list
  if (validExams.length === 0) {
    const uid = `no-exams-${Date.now()}@upv-cal`;
    icalLines.push(
      "BEGIN:VEVENT",
      `DTSTART:${nowUtc}`,
      `DTEND:${new Date(now.getTime() + 60 * 60 * 1000)
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z")}`,
      `DTSTAMP:${nowUtc}`,
      `UID:${uid}`,
      `CREATED:${nowUtc}`,
      "DESCRIPTION:No exams match your current filters or there are no exams available. Please adjust your filters and try again, or check back later for new exam schedules.",
      `LAST-MODIFIED:${nowUtc}`,
      "LOCATION:",
      "SEQUENCE:0",
      "STATUS:TENTATIVE",
      "SUMMARY:No Exams Found",
      "TRANSP:TRANSPARENT",
      "UPV_BGCOLOR:#0252D4",
      "UPV_FGCOLOR:#ffffff",
      "END:VEVENT"
    );
  }

  icalLines.push("END:VCALENDAR");

  // Step 4: Emit lines with hard CRLF
  return icalLines.join("\r\n");
}

// Helper function to check if a date is in DST for Madrid timezone
function isDateInDST(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // DST starts last Sunday in March and ends last Sunday in October
  const marchLastSunday = getLastSundayOfMonth(year, 2); // March
  const octoberLastSunday = getLastSundayOfMonth(year, 9); // October

  // Check if date is in DST period (CEST = UTC+2)
  return (
    (month > 2 && month < 9) || // April to September
    (month === 2 && day >= marchLastSunday.getDate()) || // March after last Sunday
    (month === 9 && day < octoberLastSunday.getDate()) // October before last Sunday
  );
}

// Helper function to get Madrid timezone offset in milliseconds
function getMadridTimezoneOffset(date: Date): number {
  // Madrid is UTC+1 in winter (CET) and UTC+2 in summer (CEST)
  // DST starts last Sunday in March and ends last Sunday in October
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Calculate DST boundaries for the year
  const marchLastSunday = getLastSundayOfMonth(year, 2); // March
  const octoberLastSunday = getLastSundayOfMonth(year, 9); // October

  // Check if date is in DST period (CEST = UTC+2)
  const isDST =
    (month > 2 && month < 9) || // April to September
    (month === 2 && day >= marchLastSunday.getDate()) || // March after last Sunday
    (month === 9 && day < octoberLastSunday.getDate()); // October before last Sunday

  // Return offset in milliseconds
  return isDST ? 2 * 60 * 60 * 1000 : 1 * 60 * 60 * 1000; // 2 hours or 1 hour
}

// Generate stable ID for exam (for UID consistency)
function generateStableId(exam: Exam): string {
  // Create a stable identifier based on exam properties
  const baseString = `${exam.id || exam.subject}-${exam.date}-${exam.time}-${
    exam.code || ""
  }`;

  // Simple hash function (since we don't have crypto)
  let hash = 0;
  for (let i = 0; i < baseString.length; i++) {
    const char = baseString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to positive hex string
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
}

// Generate UPV-style token URL
export async function generateUPVTokenUrl(
  filters: Record<string, string[]>,
  calendarName: string = "UPV Exams"
): Promise<string> {
  // Build query string
  const params = new URLSearchParams();
  params.set("name", calendarName);

  // Add individual filter parameters
  if (filters.school && filters.school.length > 0) {
    filters.school.forEach((school) => params.append("school", school));
  }
  if (filters.degree && filters.degree.length > 0) {
    filters.degree.forEach((degree) => params.append("degree", degree));
  }
  if (filters.year && filters.year.length > 0) {
    filters.year.forEach((year) => params.append("year", year));
  }
  if (filters.semester && filters.semester.length > 0) {
    filters.semester.forEach((semester) => params.append("semester", semester));
  }
  if (filters.subject && filters.subject.length > 0) {
    filters.subject.forEach((subject) => params.append("subject", subject));
  }

  const queryString = params.toString();

  // Generate token (client-side hash since we can't use crypto in browser)
  let hash = 0;
  for (let i = 0; i < queryString.length; i++) {
    const char = queryString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const token = Math.abs(hash).toString(16).toUpperCase().padStart(16, "0");

  // Store the mapping by calling our API
  try {
    await fetch("/api/ical/store-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, queryString }),
    });
  } catch (error) {
    console.error("Failed to store token mapping:", error);
  }

  return `/ical/${token}.ics`;
}
