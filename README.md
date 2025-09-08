# UPV Calendar v2

A modern calendar application for viewing and managing UPV (Universitat Politècnica de València) exam schedules with Google Calendar integration.

## Features

### 📅 Calendar Management
- **Interactive Calendar View**: Browse exams by month with an intuitive calendar interface
- **List View**: View all exams in a detailed list format
- **Advanced Filtering**: Filter exams by school, degree, year, semester, and subject
- **Save Calendar Views**: Save your filtered views for quick access

### 🔗 Google Calendar Integration
- **Export to Google Calendar**: Export selected exams directly to your Google Calendar
- **Automatic Calendar Creation**: Creates a dedicated "UPV Exams" calendar
- **Smart Event Details**: Each exam includes complete information (subject, location, time, etc.)
- **Reminder Setup**: Automatic email and popup reminders

### 🔐 Authentication
- **Supabase Integration**: Secure user authentication and data management
- **Session Management**: Persistent login sessions
- **Protected Routes**: Secure access to user-specific features

## Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations
- **Radix UI**: Accessible component primitives
- **Lucide React**: Modern icon library

### Backend
- **Supabase**: Backend-as-a-Service for authentication and database
- **PostgreSQL**: Primary database
- **Spring Boot**: Java backend service 

## Usage

### Viewing Exams
1. Navigate to the main calendar page
2. Use the filter sidebar to narrow down exams by:
   - School (ETSINF, etc.)
   - Degree program
   - Academic year
   - Semester
   - Subject
3. Switch between calendar and list views using the toggle

### Exporting to Google Calendar
1. Filter exams to show only the ones you want to export
2. Click "Export to Google Calendar" button
3. Follow the OAuth flow to authorize calendar access
4. Choose a calendar name and confirm the export
5. View your exams in Google Calendar

### Saving Calendar Views
1. Set up your desired filters
2. Click "Save View" button
3. Give your saved view a name
4. Access saved views from the "My Calendars" page

