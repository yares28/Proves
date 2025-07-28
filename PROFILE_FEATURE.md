# Profile Page Feature

## Overview

The profile page provides users with a comprehensive interface to manage their personal information and application settings. It includes avatar management, user details display, and customizable app settings.

## Features

### 1. Avatar Management
- **Google Avatar Integration**: If users are logged in with Google, their Google profile picture is automatically used as the default avatar
- **Custom Avatar Upload**: Users can upload their own profile picture
- **Avatar Preview**: Real-time preview of selected images before upload
- **Avatar Removal**: Option to remove custom avatars and revert to initials
- **File Validation**: Supports image files up to 5MB with type validation

### 2. User Information Display
- **Email Address**: Displays user's email (read-only)
- **Full Name**: Shows user's full name from authentication provider
- **Account Creation Date**: Displays when the account was created
- **Authentication Method**: Shows the provider used for authentication (Google, Email, etc.)

### 3. Application Settings
- **Theme Selection**: Choose between Light, Dark, or System theme
- **Language Selection**: Switch between Spanish and English
- **Notification Preferences**: Toggle notifications for exam updates
- **Auto-Sync Settings**: Control automatic Google Calendar synchronization
- **Compact View**: Toggle compact display mode

## Technical Implementation

### File Structure
```
app/
├── profile/
│   ├── page.tsx          # Main profile page component
│   └── layout.tsx        # Profile page layout
├── api/
│   └── profile/
│       └── avatar/
│           └── route.ts   # Avatar upload/delete API
context/
├── auth-context.tsx      # Authentication context
└── settings-context.tsx  # App settings context
components/
└── auth/
    └── user-button.tsx   # Updated to show avatars
```

### Key Components

#### Profile Page (`app/profile/page.tsx`)
- Handles avatar upload/removal via API routes
- Manages user profile information display
- Integrates with settings context for app preferences
- Provides responsive design with mobile support

#### Avatar API (`app/api/profile/avatar/route.ts`)
- **POST**: Handles avatar upload to Supabase Storage
- **DELETE**: Removes avatar and updates user metadata
- Includes file validation and error handling
- Secure authentication checks

#### Settings Context (`context/settings-context.tsx`)
- Global state management for app settings
- Persistent storage using localStorage
- Theme integration with next-themes
- Type-safe settings interface

### Authentication Integration

The profile page integrates with the existing authentication system:

1. **Google OAuth Users**: Automatically displays Google profile picture
2. **Email Users**: Shows initials based on name or email
3. **Provider Detection**: Shows authentication method badge
4. **Secure Access**: Redirects unauthenticated users

### Storage Implementation

Avatar files are stored in Supabase Storage:
- **Bucket**: `avatars`
- **Path**: `avatars/{user-id}-{timestamp}.{extension}`
- **Public URLs**: Automatically generated for display
- **Cleanup**: Old avatars can be managed via Supabase dashboard

## Usage

### For Users
1. Navigate to profile via user dropdown menu
2. Click camera icon to upload new avatar
3. Adjust app settings using toggles and buttons
4. Settings are automatically saved and persisted

### For Developers
1. Settings are available globally via `useSettings()` hook
2. Avatar management uses secure API routes
3. All components are fully typed with TypeScript
4. Responsive design works on all screen sizes

## Security Considerations

- File upload validation (type and size)
- Authentication required for all profile operations
- Secure API routes with proper error handling
- User data isolation (users can only modify their own profile)
- XSS protection through proper input sanitization

## Future Enhancements

- Profile picture cropping/editing
- Additional user preferences
- Export/import settings
- Profile data export
- Two-factor authentication setup 