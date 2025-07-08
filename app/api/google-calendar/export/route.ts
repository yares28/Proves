import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import type { Exam } from '@/types/exam';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authCode, exams, calendarName } = body;

    if (!authCode || !exams || !Array.isArray(exams) || exams.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );

    // Exchange authorization code for access token
    const { tokens } = await oauth2Client.getToken(authCode);
    oauth2Client.setCredentials(tokens);

    // Initialize Calendar API
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Create a new calendar for exams
    const calendarResponse = await calendar.calendars.insert({
      requestBody: {
        summary: calendarName || 'UPV Exams',
        description: 'Calendar for UPV exam schedules',
        timeZone: 'Europe/Madrid',
      },
    });

    const calendarId = calendarResponse.data.id;

    if (!calendarId) {
      throw new Error('Failed to create calendar');
    }

    // Convert exams to calendar events
    const events = exams.map((exam: Exam) => {
      // Parse date and time
      const examDate = new Date(exam.date);
      const [hours, minutes] = exam.time.split(':').map(Number);
      
      // Set start time
      const startTime = new Date(examDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      // Set end time (assume 2 hours duration)
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
      };
    });

    // Create events in batches to avoid rate limits
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < events.length; i += batchSize) {
      batches.push(events.slice(i, i + batchSize));
    }

    // Process batches sequentially to avoid rate limits
    for (const batch of batches) {
      const eventPromises = batch.map(event => 
        calendar.events.insert({
          calendarId,
          requestBody: event,
        })
      );
      
      await Promise.all(eventPromises);
      
      // Add a small delay between batches
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return NextResponse.json({
      success: true,
      calendarId,
      eventsCreated: events.length,
    });

  } catch (error) {
    console.error('Error exporting to Google Calendar:', error);
    
    let errorMessage = 'Failed to export exams';
    
    if (error instanceof Error) {
      if (error.message.includes('invalid_grant')) {
        errorMessage = 'Authorization code expired or invalid. Please try again.';
      } else if (error.message.includes('access_denied')) {
        errorMessage = 'Access denied. Please grant calendar permissions.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 