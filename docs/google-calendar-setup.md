# Google Calendar Integration Setup

This guide explains how to set up Google Calendar export functionality for the UPV Calendar application.

## Prerequisites

1. A Google account with access to Google Cloud Console
2. The UPV Calendar application running locally or deployed

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen if prompted:
   - Choose "External" user type
   - Fill in the required fields (App name, User support email, etc.)
   - Add your email to test users
4. For Application type, select "Web application"
5. Add authorized redirect URIs:
   - For development: `http://localhost:3000/auth/callback`
   - For production: `https://upv-cal.vercel.app/auth/callback`
  6. Click "Create"
  7. Copy the Client ID and Client Secret (keep these secure!)

## Step 3: Configure Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Google Calendar OAuth2 Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://upv-cal.vercel.app/auth/callback
```

### Important Notes:

- Replace `your_actual_client_id_here` and `your_actual_client_secret_here` with your actual credentials
- Never commit `.env.local` to version control
- The redirect URI must match exactly what you configured in Google Console
- For production, update the redirect URI to use your actual domain with HTTPS

## Step 4: Test the Integration

1. Restart your development server after adding environment variables
2. Navigate to the calendar page
3. Click on "Export to Google Calendar" 
4. Follow the OAuth flow:
   - Click "Open Google Authorization"
   - Sign in to Google and grant calendar permissions
   - Copy the authorization code from the URL
   - Paste it in the dialog and click "Export to Google Calendar"

## Security Considerations

### Development
- Use `http://localhost:3000` for local development
- Keep credentials in `.env.local` file
- Never commit environment files to git

### Production (Vercel)
- Use HTTPS for all redirect URIs
- Store credentials as environment variables in Vercel dashboard:
  - Go to your Vercel project dashboard
  - Navigate to Settings > Environment Variables
  - Add the Google OAuth2 credentials
  - Redeploy your app after adding variables
- Consider using Google Cloud IAM for service account authentication for server-side operations
- Implement proper error handling for expired tokens

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Ensure the redirect URI in your environment matches exactly what's configured in Google Console
   - Check for trailing slashes and protocol (http vs https)

2. **"invalid_client" error**
   - Verify your Client ID and Client Secret are correct
   - Ensure the OAuth client is enabled

3. **"access_denied" error**
   - User denied permissions during OAuth flow
   - Check OAuth consent screen configuration

4. **API quota exceeded**
   - Google Calendar API has usage limits
   - Implement exponential backoff for rate limiting

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify environment variables are loaded correctly
3. Test OAuth flow manually in Google OAuth Playground
4. Check API quotas and limits in Google Cloud Console

## Features

The Google Calendar export includes:

- **Calendar Creation**: Creates a new calendar named "UPV Exams" (or custom name)
- **Event Details**: Each exam becomes a calendar event with:
  - Subject name as the event title
  - Complete exam details in description
  - Correct date and time
  - Location information
  - 2-hour duration (configurable)
  - Email and popup reminders
- **Batch Processing**: Handles multiple exams efficiently
- **Error Handling**: Proper error messages for common issues

## Customization

You can customize the export behavior by modifying:

- Event duration in `app/api/google-calendar/export/route.ts`
- Reminder settings (timing and methods)
- Event colors and categories
- Calendar descriptions and metadata 