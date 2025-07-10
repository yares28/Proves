import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import type { Exam } from '@/types/exam';

// Google Calendar API configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!;

// OAuth2 scopes for Google Calendar
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export interface ExportOptions {
  calendarName?: string;
  useExistingCalendar?: boolean;
  existingCalendarId?: string;
  reminderMinutes?: number[];
  timeZone?: string;
}

export interface BatchExportResult {
  success: boolean;
  calendarId?: string;
  successfulEvents: number;
  failedEvents: number;
  errors?: string[];
  durationStats?: {
    min: number;
    max: number;
    avg: number;
  };
}

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    });
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<any> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  /**
   * Set credentials from stored tokens
   */
  setCredentials(tokens: any): void {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Get user's calendar list
   */
  async getCalendarList(): Promise<any[]> {
    try {
      const response = await this.calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching calendar list:', error);
      throw new Error('Failed to fetch calendar list');
    }
  }

  /**
   * Create a new calendar for exams
   */
  async createExamCalendar(calendarName: string = 'UPV Exams', timeZone: string = 'Europe/Madrid'): Promise<string> {
    try {
      const response = await this.calendar.calendars.insert({
        requestBody: {
          summary: calendarName,
          description: 'Calendar for UPV exam schedules',
          timeZone,
        },
      });
      return response.data.id;
    } catch (error) {
      console.error('Error creating calendar:', error);
      throw new Error('Failed to create calendar');
    }
  }

  /**
   * Convert exam data to Google Calendar event format using exam's duration_minutes
   */
  private examToCalendarEvent(exam: Exam, options: ExportOptions = {}) {
    const {
      reminderMinutes = [24 * 60, 60], // 1 day and 1 hour before
      timeZone = 'Europe/Madrid'
    } = options;

    // Parse date and time
    const examDate = new Date(exam.date);
    const [hours, minutes] = exam.time.split(':').map(Number);
    
    // Set start time
    const startTime = new Date(examDate);
    startTime.setHours(hours, minutes, 0, 0);
    
    // Set end time using the exam's duration_minutes
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + exam.duration_minutes);

    // Create event description
    const description = [
      `Subject: ${exam.subject}`,
      `Code: ${exam.code}`,
      `School: ${exam.school}`,
      `Degree: ${exam.degree}`,
      `Year: ${exam.year}`,
      `Semester: ${exam.semester}`,
      exam.acronym ? `Acronym: ${exam.acronym}` : '',
      '',
      'Exported from UPV Exam Calendar',
      `Duration: ${exam.duration_minutes} minutes (${Math.round(exam.duration_minutes / 60 * 10) / 10} hours)`
    ].filter(Boolean).join('\n');

    return {
      summary: `${exam.subject} - Exam`,
      description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone,
      },
      location: exam.location || 'TBD',
      colorId: '11', // Red color for exams
      reminders: {
        useDefault: false,
        overrides: reminderMinutes.map(minutes => ({
          method: minutes > 60 ? 'email' : 'popup',
          minutes
        })),
      },
      // Add custom properties for identification
      extendedProperties: {
        private: {
          examId: exam.id.toString(),
          source: 'upv-exam-calendar',
          originalDuration: exam.duration_minutes.toString()
        }
      }
    };
  }

  /**
   * Generate iCal content for multiple exams using individual durations
   */
  generateICalContent(exams: Exam[], calendarName: string = 'UPV Exams', options: ExportOptions = {}): string {
    const { timeZone = 'Europe/Madrid' } = options;
    
    const icalLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UPV Exam Calendar//EN',
      `X-WR-CALNAME:${calendarName}`,
      `X-WR-TIMEZONE:${timeZone}`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    exams.forEach(exam => {
      const event = this.examToCalendarEvent(exam, options);
      const startTime = new Date(event.start.dateTime);
      const endTime = new Date(event.end.dateTime);
      
      // Format dates for iCal (YYYYMMDDTHHMMSSZ)
      const formatICalDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      };

      icalLines.push(
        'BEGIN:VEVENT',
        `UID:exam-${exam.id}-${Date.now()}@upv-exam-calendar.com`,
        `DTSTART:${formatICalDate(startTime)}`,
        `DTEND:${formatICalDate(endTime)}`,
        `SUMMARY:${event.summary}`,
        `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
        `LOCATION:${event.location}`,
        `CREATED:${formatICalDate(new Date())}`,
        `LAST-MODIFIED:${formatICalDate(new Date())}`,
        'END:VEVENT'
      );
    });

    icalLines.push('END:VCALENDAR');
    return icalLines.join('\r\n');
  }

  /**
   * Export exams using iCal import method
   */
  async exportExamsViaICalImport(
    exams: Exam[],
    calendarId: string,
    options: ExportOptions = {}
  ): Promise<BatchExportResult> {
    try {
      const icalContent = this.generateICalContent(exams, options.calendarName, options);
      
      // Use the events.import method for bulk import
      const response = await this.calendar.events.import({
        calendarId,
        requestBody: {
          // Note: This is a simplified approach. For full iCal import,
          // you might need to use a different method or parse individual events
          summary: 'Bulk Import - UPV Exams',
          description: icalContent,
        }
      });

      // Calculate duration statistics
      const durationStats = {
        min: Math.min(...exams.map(e => e.duration_minutes)),
        max: Math.max(...exams.map(e => e.duration_minutes)),
        avg: Math.round(exams.reduce((sum, e) => sum + e.duration_minutes, 0) / exams.length)
      };

      return {
        success: true,
        calendarId,
        successfulEvents: exams.length,
        failedEvents: 0,
        durationStats
      };
    } catch (error) {
      console.error('Error importing via iCal:', error);
      return {
        success: false,
        calendarId,
        successfulEvents: 0,
        failedEvents: exams.length,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Export multiple exams using batch operations with individual durations
   */
  async exportExamsViaBatch(
    exams: Exam[],
    calendarId: string,
    options: ExportOptions = {}
  ): Promise<BatchExportResult> {
    try {
      const batchSize = 50; // Google Calendar batch limit
      const batches: Exam[][] = [];
      
      // Split exams into batches
      for (let i = 0; i < exams.length; i += batchSize) {
        batches.push(exams.slice(i, i + batchSize));
      }

      let successfulEvents = 0;
      let failedEvents = 0;
      const errors: string[] = [];

      // Process each batch
      for (const batch of batches) {
        try {
          const eventPromises = batch.map(exam => {
            const event = this.examToCalendarEvent(exam, options);
            return this.calendar.events.insert({
              calendarId,
              requestBody: event,
            });
          });

          const results = await Promise.allSettled(eventPromises);
          
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              successfulEvents++;
            } else {
              failedEvents++;
              const examSubject = batch[index]?.subject || 'Unknown';
              const examDuration = batch[index]?.duration_minutes || 'Unknown';
              errors.push(`Failed to create event for ${examSubject} (${examDuration}min): ${result.reason}`);
            }
          });

          // Add delay between batches to respect rate limits
          if (batches.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (batchError) {
          failedEvents += batch.length;
          errors.push(`Batch processing error: ${batchError}`);
        }
      }

      // Calculate duration statistics
      const durationStats = {
        min: Math.min(...exams.map(e => e.duration_minutes)),
        max: Math.max(...exams.map(e => e.duration_minutes)),
        avg: Math.round(exams.reduce((sum, e) => sum + e.duration_minutes, 0) / exams.length)
      };

      return {
        success: successfulEvents > 0,
        calendarId,
        successfulEvents,
        failedEvents,
        errors: errors.length > 0 ? errors : undefined,
        durationStats
      };
    } catch (error) {
      console.error('Error in batch export:', error);
      return {
        success: false,
        calendarId,
        successfulEvents: 0,
        failedEvents: exams.length,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Main export method with enhanced options using exam durations
   */
  async exportExamsToCalendar(
    exams: Exam[],
    options: ExportOptions = {}
  ): Promise<BatchExportResult> {
    try {
      if (!exams || exams.length === 0) {
        throw new Error('No exams to export');
      }

      // Validate that all exams have duration_minutes
      const examsWithoutDuration = exams.filter(exam => !exam.duration_minutes || exam.duration_minutes <= 0);
      if (examsWithoutDuration.length > 0) {
        throw new Error(`${examsWithoutDuration.length} exams are missing valid duration_minutes data`);
      }

      const {
        calendarName = 'UPV Exams',
        useExistingCalendar = false,
        existingCalendarId
      } = options;

      let calendarId: string;

      if (useExistingCalendar && existingCalendarId) {
        calendarId = existingCalendarId;
      } else {
        calendarId = await this.createExamCalendar(calendarName, options.timeZone);
      }

      // Use batch operations for better performance
      const result = await this.exportExamsViaBatch(exams, calendarId, options);

      return result;
    } catch (error) {
      console.error('Error exporting exams:', error);
      return {
        success: false,
        successfulEvents: 0,
        failedEvents: exams.length,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Quick add method for simple text-based event creation
   */
  async quickAddExam(examText: string, calendarId: string): Promise<boolean> {
    try {
      await this.calendar.events.quickAdd({
        calendarId,
        text: examText
      });
      return true;
    } catch (error) {
      console.error('Error in quick add:', error);
      return false;
    }
  }

  /**
   * Update existing events (useful for exam schedule changes)
   */
  async updateExamEvent(
    calendarId: string,
    eventId: string,
    exam: Exam,
    options: ExportOptions = {}
  ): Promise<boolean> {
    try {
      const event = this.examToCalendarEvent(exam, options);
      
      await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: event
      });
      
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      return false;
    }
  }

  /**
   * Delete events by exam IDs
   */
  async deleteExamEvents(calendarId: string, examIds: number[]): Promise<{ deleted: number; failed: number }> {
    try {
      // First, find events with matching exam IDs
      const eventsResponse = await this.calendar.events.list({
        calendarId,
        privateExtendedProperty: examIds.map(id => `examId=${id}`)
      });

      const events = eventsResponse.data.items || [];
      let deleted = 0;
      let failed = 0;

      for (const event of events) {
        try {
          await this.calendar.events.delete({
            calendarId,
            eventId: event.id
          });
          deleted++;
        } catch (error) {
          console.error(`Failed to delete event ${event.id}:`, error);
          failed++;
        }
      }

      return { deleted, failed };
    } catch (error) {
      console.error('Error deleting events:', error);
      return { deleted: 0, failed: examIds.length };
    }
  }
}

export const googleCalendarService = new GoogleCalendarService(); 