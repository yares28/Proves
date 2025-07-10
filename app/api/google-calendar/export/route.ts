import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import type { Exam } from '@/types/exam';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      authCode, 
      exams, 
      calendarName, 
      useExistingCalendar = false,
      existingCalendarId,
      reminderMinutes = [24 * 60, 60],
      timeZone = 'Europe/Madrid'
    } = body;

    if (!authCode || !exams || !Array.isArray(exams) || exams.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: authCode and exams array' },
        { status: 400 }
      );
    }

    // Validate existing calendar selection
    if (useExistingCalendar && !existingCalendarId) {
      return NextResponse.json(
        { error: 'Existing calendar ID is required when useExistingCalendar is true' },
        { status: 400 }
      );
    }

    // Validate that exams have duration_minutes
    const examsWithoutDuration = exams.filter((exam: Exam) => !exam.duration_minutes || exam.duration_minutes <= 0);
    if (examsWithoutDuration.length > 0) {
      return NextResponse.json(
        { error: `${examsWithoutDuration.length} exams are missing valid duration_minutes data` },
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
    try {
      const { tokens } = await oauth2Client.getToken(authCode);
      oauth2Client.setCredentials(tokens);
    } catch (tokenError) {
      console.error('Token exchange error:', tokenError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid or expired authorization code. Please try the authorization process again.' 
        },
        { status: 401 }
      );
    }

    // Initialize Calendar API
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    let calendarId: string;

    // Handle calendar selection/creation
    if (useExistingCalendar && existingCalendarId) {
      // Verify the calendar exists and is accessible
      try {
        await calendar.calendars.get({ calendarId: existingCalendarId });
        calendarId = existingCalendarId;
      } catch (calendarError) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Selected calendar not found or not accessible. Please choose a different calendar.' 
          },
          { status: 404 }
        );
      }
    } else {
      // Create a new calendar
      try {
        const calendarResponse = await calendar.calendars.insert({
          requestBody: {
            summary: calendarName || 'UPV Exams',
            description: 'Calendar for UPV exam schedules - Created by UPV Exam Calendar App',
            timeZone,
          },
        });

        calendarId = calendarResponse.data.id!;
        if (!calendarId) {
          throw new Error('Failed to retrieve calendar ID after creation');
        }
      } catch (createError) {
        console.error('Calendar creation error:', createError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to create new calendar. Please check your permissions.' 
          },
          { status: 500 }
        );
      }
    }

    // Convert exams to calendar events using individual durations
    const convertExamToEvent = (exam: Exam) => {
      // Parse date and time
      const examDate = new Date(exam.date);
      const [hours, minutes] = exam.time.split(':').map(Number);
      
      // Set start time
      const startTime = new Date(examDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      // Set end time using duration_minutes from the exam
      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + exam.duration_minutes);

      // Create enhanced event description
      const description = [
        `Subject: ${exam.subject}`,
        `Code: ${exam.code}`,
        `School: ${exam.school}`,
        `Degree: ${exam.degree}`,
        `Year: ${exam.year}`,
        `Semester: ${exam.semester}`,
        exam.acronym ? `Acronym: ${exam.acronym}` : '',
        '',
        '📅 Exported from UPV Exam Calendar',
        `⏰ Duration: ${exam.duration_minutes} minutes (${Math.round(exam.duration_minutes / 60 * 10) / 10} hours)`,
        `🕒 Export Time: ${new Date().toLocaleString()}`
      ].filter(Boolean).join('\n');

      return {
        summary: `🎓 ${exam.subject} - Exam`,
        description,
        start: {
          dateTime: startTime.toISOString(),
          timeZone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone,
        },
        location: exam.location || 'Location TBD',
        colorId: '11', // Red color for exams
        reminders: {
          useDefault: false,
          overrides: reminderMinutes.map((minutes: number) => ({
            method: minutes > 60 ? 'email' : 'popup',
            minutes
          })),
        },
        // Add custom properties for tracking
        extendedProperties: {
          private: {
            examId: exam.id.toString(),
            source: 'upv-exam-calendar',
            exportedAt: new Date().toISOString(),
            originalDuration: exam.duration_minutes.toString()
          }
        }
      };
    };

    const events = exams.map(convertExamToEvent);

    // Enhanced batch processing with better error handling
    const batchSize = 50; // Google Calendar batch limit
    const batches: typeof events[] = [];
    
    // Split events into batches
    for (let i = 0; i < events.length; i += batchSize) {
      batches.push(events.slice(i, i + batchSize));
    }

    let successfulEvents = 0;
    let failedEvents = 0;
    const errors: string[] = [];

    // Process batches with detailed error tracking
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      try {
        const eventPromises = batch.map((event, eventIndex) => 
          calendar.events.insert({
            calendarId,
            requestBody: event,
          }).catch(error => ({
            error,
            eventIndex: batchIndex * batchSize + eventIndex,
            event
          }))
        );
        
        const results = await Promise.all(eventPromises);
        
        results.forEach((result, localIndex) => {
          if ('error' in result) {
            failedEvents++;
            const globalIndex = result.eventIndex;
            const examSubject = exams[globalIndex]?.subject || 'Unknown';
            const examDuration = exams[globalIndex]?.duration_minutes || 'Unknown';
            errors.push(`Event ${globalIndex + 1} (${examSubject}, ${examDuration}min): ${result.error.message || 'Unknown error'}`);
          } else {
            successfulEvents++;
          }
        });

        // Add progressive delay between batches based on size
        if (batchIndex < batches.length - 1) {
          const delay = Math.min(200 + (batchIndex * 50), 1000); // Progressive delay up to 1 second
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (batchError) {
        // Handle complete batch failure
        failedEvents += batch.length;
        errors.push(`Batch ${batchIndex + 1} complete failure: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`);
      }
    }

    // Calculate duration statistics for the response
    const durationStats = {
      min: Math.min(...exams.map(e => e.duration_minutes)),
      max: Math.max(...exams.map(e => e.duration_minutes)),
      avg: Math.round(exams.reduce((sum, e) => sum + e.duration_minutes, 0) / exams.length)
    };

    // Prepare detailed response
    const response = {
      success: successfulEvents > 0,
      calendarId,
      eventsCreated: successfulEvents,
      eventsFailed: failedEvents,
      totalEvents: exams.length,
      calendarName: useExistingCalendar ? 'Existing Calendar' : calendarName,
      batchesProcessed: batches.length,
      durationStats,
      exportSettings: {
        reminderMinutes,
        timeZone,
        individualDurations: true
      }
    };

    if (errors.length > 0) {
      // Log errors for debugging but limit what we send to client
      console.error('Export errors:', errors);
      (response as any).errors = errors.slice(0, 5); // Limit to first 5 errors
      (response as any).totalErrors = errors.length;
    }

    // Return appropriate status based on results
    if (successfulEvents === 0) {
      return NextResponse.json(
        { 
          ...response, 
          error: 'Failed to create any events. Please check your permissions and try again.' 
        },
        { status: 500 }
      );
    } else if (failedEvents > 0) {
      return NextResponse.json(response, { status: 207 }); // Partial success
    } else {
      return NextResponse.json(response, { status: 200 }); // Complete success
    }

  } catch (error) {
    console.error('Unexpected error in Google Calendar export:', error);
    
    let errorMessage = 'An unexpected error occurred during export';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('invalid_grant')) {
        errorMessage = 'Authorization expired. Please restart the authorization process.';
        statusCode = 401;
      } else if (error.message.includes('access_denied')) {
        errorMessage = 'Access denied. Please grant calendar permissions and try again.';
        statusCode = 403;
      } else if (error.message.includes('quota')) {
        errorMessage = 'Google Calendar API quota exceeded. Please try again later.';
        statusCode = 429;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        eventsCreated: 0,
        eventsFailed: 0
      },
      { status: statusCode }
    );
  }
} 