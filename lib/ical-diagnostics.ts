/**
 * iCalendar Diagnostics Tool
 * Comprehensive validation and debugging for iCalendar generation
 */

import type { Exam } from '@/types/exam';

export interface ICalValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details: {
    lineCount: number;
    eventCount: number;
    hasTimezone: boolean;
    hasValidStructure: boolean;
    encoding: string;
    size: number;
  };
}

export interface ICalDiagnosticOptions {
  validateRFC5545: boolean;
  checkEncoding: boolean;
  validateTimezones: boolean;
  checkLineEndings: boolean;
  maxFileSize?: number; // in bytes
}

/**
 * Comprehensive iCalendar validation
 */
export function validateICalContent(
  content: string, 
  options: ICalDiagnosticOptions = {
    validateRFC5545: true,
    checkEncoding: true,
    validateTimezones: true,
    checkLineEndings: true,
    maxFileSize: 10 * 1024 * 1024 // 10MB default
  }
): ICalValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic structure validation
  const lines = content.split(/\r?\n/);
  const eventCount = (content.match(/BEGIN:VEVENT/g) || []).length;
  const hasTimezone = content.includes('BEGIN:VTIMEZONE');
  
  // 1. Basic structure validation
  if (!content.startsWith('BEGIN:VCALENDAR')) {
    errors.push('Missing BEGIN:VCALENDAR at start');
  }
  
  if (!content.endsWith('END:VCALENDAR')) {
    errors.push('Missing END:VCALENDAR at end');
  }
  
  // 2. Required properties validation
  const requiredProps = ['VERSION', 'PRODID'];
  requiredProps.forEach(prop => {
    if (!content.includes(`${prop}:`)) {
      errors.push(`Missing required property: ${prop}`);
    }
  });
  
  // 3. Line length validation (RFC 5545: max 75 octets)
  lines.forEach((line, index) => {
    if (line.length > 75 && !line.startsWith(' ')) {
      warnings.push(`Line ${index + 1} exceeds 75 characters and is not folded: "${line.substring(0, 50)}..."`);
    }
  });
  
  // 4. Line ending validation
  if (options.checkLineEndings) {
    if (content.includes('\r\n') && content.includes('\n') && !content.includes('\r\n')) {
      warnings.push('Mixed line endings detected (should be consistent CRLF)');
    }
  }
  
  // 5. Event validation
  const eventBlocks = content.split('BEGIN:VEVENT').slice(1);
  eventBlocks.forEach((eventBlock, index) => {
    const eventLines = eventBlock.split(/\r?\n/);
    
    // Check for required event properties
    const requiredEventProps = ['UID', 'DTSTART', 'DTEND'];
    requiredEventProps.forEach(prop => {
      if (!eventBlock.includes(`${prop}`)) {
        errors.push(`Event ${index + 1}: Missing required property ${prop}`);
      }
    });
    
    // Validate DTSTART/DTEND format
    const dtstartMatch = eventBlock.match(/DTSTART(?:;[^:]*)?:([^\r\n]+)/);
    const dtendMatch = eventBlock.match(/DTEND(?:;[^:]*)?:([^\r\n]+)/);
    
    if (dtstartMatch) {
      const dtstartValue = dtstartMatch[1];
      const hasTzid = eventBlock.includes('DTSTART;TZID=');
      const hasZSuffix = dtstartValue.endsWith('Z');
      
      if (hasTzid && hasZSuffix) {
        errors.push(`Event ${index + 1}: DTSTART has TZID parameter but uses UTC format (Z suffix)`);
      }
      
      if (!hasTzid && !hasZSuffix && !dtstartValue.match(/^\d{8}T\d{6}$/)) {
        warnings.push(`Event ${index + 1}: DTSTART format may be ambiguous without timezone info`);
      }
    }
    
    if (dtendMatch) {
      const dtendValue = dtendMatch[1];
      const hasTzid = eventBlock.includes('DTEND;TZID=');
      const hasZSuffix = dtendValue.endsWith('Z');
      
      if (hasTzid && hasZSuffix) {
        errors.push(`Event ${index + 1}: DTEND has TZID parameter but uses UTC format (Z suffix)`);
      }
    }
  });
  
  // 6. Timezone validation
  if (options.validateTimezones && hasTimezone) {
    const timezoneBlock = content.match(/BEGIN:VTIMEZONE([\s\S]*?)END:VTIMEZONE/);
    if (timezoneBlock) {
      const tzContent = timezoneBlock[1];
      if (!tzContent.includes('TZID:')) {
        errors.push('VTIMEZONE block missing TZID property');
      }
      
      // Check for standard/daylight time definitions
      const hasStandard = tzContent.includes('BEGIN:STANDARD');
      const hasDaylight = tzContent.includes('BEGIN:DAYLIGHT');
      
      if (!hasStandard && !hasDaylight) {
        warnings.push('VTIMEZONE block should include STANDARD or DAYLIGHT time definitions');
      }
    }
  }
  
  // 7. Encoding validation
  let encoding = 'unknown';
  if (options.checkEncoding) {
    // Check for non-ASCII characters
    const hasNonAscii = /[^\x00-\x7F]/.test(content);
    if (hasNonAscii) {
      encoding = 'UTF-8 (contains non-ASCII)';
      // Check if non-ASCII characters are properly escaped
      const unescapedChars = content.match(/[^\x00-\x7F]/g);
      if (unescapedChars && unescapedChars.length > 0) {
        warnings.push(`Found ${unescapedChars.length} non-ASCII characters that may need escaping`);
      }
    } else {
      encoding = 'ASCII';
    }
  }
  
  // 8. File size validation
  const size = new Blob([content]).size;
  if (options.maxFileSize && size > options.maxFileSize) {
    warnings.push(`File size (${size} bytes) exceeds recommended maximum (${options.maxFileSize} bytes)`);
  }
  
  // 9. Text escaping validation
  const textFields = content.match(/(SUMMARY|DESCRIPTION|LOCATION):[^\r\n]+/g) || [];
  textFields.forEach(field => {
    const value = field.split(':')[1];
    if (value) {
      // Check for unescaped special characters
      if (value.includes(';') && !value.includes('\\;')) {
        warnings.push(`Unescaped semicolon in: ${field.substring(0, 50)}...`);
      }
      if (value.includes(',') && !value.includes('\\,')) {
        warnings.push(`Unescaped comma in: ${field.substring(0, 50)}...`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    details: {
      lineCount: lines.length,
      eventCount,
      hasTimezone,
      hasValidStructure: errors.length === 0,
      encoding,
      size
    }
  };
}

/**
 * Generate diagnostic report for exam data
 */
export function diagnoseExamData(exams: Exam[]): {
  isValid: boolean;
  issues: string[];
  summary: {
    totalExams: number;
    dateRange: { earliest?: string; latest?: string };
    missingFields: string[];
    invalidDates: number;
    invalidTimes: number;
  };
} {
  const issues: string[] = [];
  const missingFields: Set<string> = new Set();
  let invalidDates = 0;
  let invalidTimes = 0;
  let earliestDate: string | undefined;
  let latestDate: string | undefined;
  
  exams.forEach((exam, index) => {
    // Check required fields
    const requiredFields: (keyof Exam)[] = ['id', 'subject', 'code', 'date', 'time', 'duration_minutes'];
    requiredFields.forEach(field => {
      if (!exam[field] || exam[field] === '') {
        missingFields.add(field);
        issues.push(`Exam ${index + 1}: Missing ${field}`);
      }
    });
    
    // Validate date format
    if (exam.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(exam.date)) {
        invalidDates++;
        issues.push(`Exam ${index + 1}: Invalid date format "${exam.date}" (expected YYYY-MM-DD)`);
      } else {
        const examDate = new Date(exam.date);
        if (isNaN(examDate.getTime())) {
          invalidDates++;
          issues.push(`Exam ${index + 1}: Invalid date "${exam.date}"`);
        } else {
          if (!earliestDate || exam.date < earliestDate) earliestDate = exam.date;
          if (!latestDate || exam.date > latestDate) latestDate = exam.date;
        }
      }
    }
    
    // Validate time format
    if (exam.time) {
      const timeRegex = /^\d{1,2}:\d{2}$/;
      if (!timeRegex.test(exam.time)) {
        invalidTimes++;
        issues.push(`Exam ${index + 1}: Invalid time format "${exam.time}" (expected HH:MM)`);
      } else {
        const [hours, minutes] = exam.time.split(':').map(Number);
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          invalidTimes++;
          issues.push(`Exam ${index + 1}: Invalid time values "${exam.time}"`);
        }
      }
    }
    
    // Validate duration
    if (exam.duration_minutes && (exam.duration_minutes <= 0 || exam.duration_minutes > 600)) {
      issues.push(`Exam ${index + 1}: Unusual duration ${exam.duration_minutes} minutes`);
    }
    
    // Check for potentially problematic characters in text fields
    const textFields: (keyof Exam)[] = ['subject', 'location', 'school', 'degree'];
    textFields.forEach(field => {
      const value = exam[field];
      if (value && typeof value === 'string') {
        if (value.includes('\n') || value.includes('\r')) {
          issues.push(`Exam ${index + 1}: ${field} contains line breaks`);
        }
        if (value.length > 200) {
          issues.push(`Exam ${index + 1}: ${field} is very long (${value.length} characters)`);
        }
      }
    });
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    summary: {
      totalExams: exams.length,
      dateRange: { earliest: earliestDate, latest: latestDate },
      missingFields: Array.from(missingFields),
      invalidDates,
      invalidTimes
    }
  };
}

/**
 * Test iCalendar content with various calendar applications
 */
export function generateCompatibilityReport(content: string): {
  googleCalendar: { compatible: boolean; issues: string[] };
  outlookCalendar: { compatible: boolean; issues: string[] };
  appleCalendar: { compatible: boolean; issues: string[] };
  thunderbird: { compatible: boolean; issues: string[] };
} {
  const validation = validateICalContent(content);
  
  return {
    googleCalendar: {
      compatible: validation.isValid && !validation.errors.some(e => e.includes('TZID') && e.includes('UTC')),
      issues: validation.errors.filter(e => 
        e.includes('TZID') || 
        e.includes('line') || 
        e.includes('encoding')
      )
    },
    outlookCalendar: {
      compatible: validation.isValid && validation.details.hasTimezone,
      issues: validation.errors.filter(e => 
        e.includes('VTIMEZONE') || 
        e.includes('PRODID')
      )
    },
    appleCalendar: {
      compatible: validation.isValid,
      issues: validation.errors.filter(e => 
        e.includes('structure') || 
        e.includes('property')
      )
    },
    thunderbird: {
      compatible: validation.isValid && validation.warnings.length < 5,
      issues: [...validation.errors, ...validation.warnings.slice(0, 3)]
    }
  };
}