import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authCode } = body;

    if (!authCode) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
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
          error: 'Invalid or expired authorization code. Please try the authorization process again.' 
        },
        { status: 401 }
      );
    }

    // Initialize Calendar API
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get user's calendar list
    try {
      const response = await calendar.calendarList.list({
        maxResults: 100, // Limit to 100 calendars
        showHidden: false, // Only show visible calendars
        showDeleted: false // Don't include deleted calendars
      });

      const calendars = (response.data.items || []).map(cal => ({
        id: cal.id,
        summary: cal.summary,
        description: cal.description,
        timeZone: cal.timeZone,
        accessRole: cal.accessRole,
        backgroundColor: cal.backgroundColor,
        foregroundColor: cal.foregroundColor,
        primary: cal.primary || false,
        selected: cal.selected || false
      }));

      // Sort calendars to put primary first, then alphabetically
      calendars.sort((a, b) => {
        if (a.primary && !b.primary) return -1;
        if (!a.primary && b.primary) return 1;
        return (a.summary || '').localeCompare(b.summary || '');
      });

      return NextResponse.json({
        success: true,
        calendars,
        totalCount: calendars.length
      });

    } catch (calendarError) {
      console.error('Error fetching calendars:', calendarError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch calendar list. Please check your permissions.' 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Unexpected error in calendar list fetch:', error);
    
    let errorMessage = 'An unexpected error occurred while fetching calendars';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('invalid_grant')) {
        errorMessage = 'Authorization expired. Please restart the authorization process.';
        statusCode = 401;
      } else if (error.message.includes('access_denied')) {
        errorMessage = 'Access denied. Please grant calendar permissions and try again.';
        statusCode = 403;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: statusCode }
    );
  }
} 