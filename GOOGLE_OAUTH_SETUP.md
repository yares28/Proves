# Google OAuth Setup Guide

## Required Configuration

### 1. Environment Variables
Make sure these environment variables are set in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### 2. Supabase Configuration
In your Supabase dashboard:

1. Go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google Client ID and Client Secret
4. Go to **Authentication** → **Settings** → **Site URL**
5. Set **Site URL** to your app's public origin (e.g., `https://your-domain.com`)
   - For local development: `http://localhost:3000`

### 3. Google Cloud Console Configuration
In your Google Cloud Console:

1. Go to **APIs & Services** → **Credentials**
2. Edit your OAuth 2.0 Client ID
3. Add these **Authorized redirect URIs**:
   - `https://your-domain.com/auth/v1/callback` (Supabase's default callback)
   - `http://localhost:3000/auth/v1/callback` (for development)

### 4. Supabase Version
Ensure you're using `@supabase/supabase-js` version 2.39.0 or newer:

```bash
npm ls @supabase/supabase-js
```

## Authentication Flow

The simplified authentication flow now works as follows:

1. **User clicks "Continue with Google"** → Button triggers `handleGoogleSignIn()`
2. **Supabase handles OAuth** → `signInWithOAuth()` manages the entire flow
3. **User redirected to Google** → Supabase automatically navigates to Google consent
4. **Google redirects back** → Supabase handles the callback automatically
5. **User lands on app** → Supabase redirects to your Site URL

## Troubleshooting

### Common Issues:

1. **"access_denied" error**: Check that Google OAuth is enabled in Supabase
2. **"redirect_uri_mismatch"**: Ensure Site URL is set correctly in Supabase Auth Settings
3. **"invalid_client" error**: Verify Google Client ID/Secret in Supabase
4. **"popup_blocked" error**: Check browser popup settings

### Debug Mode:
Enable Supabase debug logs by setting:
```env
SUPABASE_LOG_LEVEL=debug
```

### Testing:
1. Clear browser cookies and localStorage
2. Try the authentication flow
3. Check browser console for any errors
4. Verify the user lands back on your app after Google consent

## Security Notes

- Supabase handles the OAuth flow securely
- Provider tokens are stored in localStorage (consider HTTP-only cookies for production)
- Refresh tokens are automatically handled by Supabase
- Session persistence is enabled for better UX
- The Site URL in Supabase Auth Settings is automatically allow-listed 