import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import type { Exam } from '@/types/exam';

// Google Calendar API configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!;

// OAuth2 scopes for Google Calendar
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

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
   * Create a new calendar for exams
   */
  async createExamCalendar(calendarName: string = 'UPV Exams'): Promise<string> {
    try {
      const response = await this.calendar.calendars.insert({
        requestBody: {
          summary: calendarName,
          description: 'Calendar for UPV exam schedules',
          timeZone: 'Europe/Madrid',
        },
      });
      return response.data.id;
    } catch (error) {
      console.error('Error creating calendar:', error);
      throw new Error('Failed to create calendar');
    }
  }

  /**
   * Convert exam data to Google Calendar event format
   */
  private examToCalendarEvent(exam: Exam, calendarId: string) {
    // Parse date and time
    const examDate = new Date(exam.date);
    const [hours, minutes] = exam.time.split(':').map(Number);
    
    // Set start time
    const startTime = new Date(examDate);
    startTime.setHours(hours, minutes, 0, 0);
    
    // Set end time (assume 2 hours duration if not specified)
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 2);

    // Create event description
    const description = [
      `Subject: ${exam.subject}`,
      `Code: ${exam.code}`,
      `School: ${exam.school}`,
      `Degree: ${exam.degree}`,
      `Year: ${exam.year}`,
      `Semester: ${exam.semester}`,
      exam.acronym ? `Acronym: ${exam.acronym}` : '',
    ].filter(Boolean).join('\n');

    return {
      calendarId,
      requestBody: {
        summary: `${exam.subject} - Exam`,
        description,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'Europe/Madrid',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'Europe/Madrid',
        },
        location: exam.location || 'TBD',
        colorId: '11', // Red color for exams
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 }, // 1 hour before
          ],
        },
      },
    };
  }

  /**
   * Export multiple exams to Google Calendar
   */
  async exportExamsToCalendar(
    exams: Exam[],
    calendarName: string = 'UPV Exams'
  ): Promise<{ success: boolean; calendarId?: string; error?: string }> {
    try {
      if (!exams || exams.length === 0) {
        throw new Error('No exams to export');
      }

      // Create or get calendar
      const calendarId = await this.createExamCalendar(calendarName);

      // Create events for each exam
      const eventPromises = exams.map((exam) => {
        const event = this.examToCalendarEvent(exam, calendarId);
        return this.calendar.events.insert(event);
      });

      await Promise.all(eventPromises);

      return {
        success: true,
        calendarId,
      };
    } catch (error) {
      console.error('Error exporting exams:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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
}

export const googleCalendarService = new GoogleCalendarService(); 