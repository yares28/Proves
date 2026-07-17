# UPV Calendar v2

A modern calendar application for viewing and managing UPV (Universitat Politècnica de València) exam schedules with Google Calendar integration.

## Features

### 📅 Calendar Management
- **Interactive Calendar View**: Browse exams by month with an intuitive calendar interface
- **List View**: View all exams in a detailed list format
- **Advanced Filtering**: Filter exams by school, degree, year, semester, and subject
- **Save Calendar Views**: Save your filtered views for quick access

### 🔗 Google Calendar Integration
- **One-click Export**: Opens Google Calendar's "add calendar" dialog with your exam feed pre-filled — just confirm to add it
- **Live Subscription (webcal/ICS)**: Subscribes to a filtered iCalendar feed served at `/api/ical`, so the calendar stays in sync
- **Smart Event Details**: Each exam includes complete information (subject, location, time, etc.)
- **Reminder Setup**: Popup reminders based on your preferences (1 hour / 1 day / 1 week before the exam)

### 🔐 Authentication
- **Supabase Integration**: Secure user authentication and data management
- **Session Management**: Persistent login sessions
- **Protected Routes**: Secure access to user-specific features

## Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations
- **Radix UI**: Accessible component primitives
- **Lucide React**: Modern icon library

### Backend
- **Supabase**: Backend-as-a-Service for authentication and database
- **PostgreSQL**: Primary database
- **Next.js Route Handlers**: Server actions and the `/api/ical` calendar feed

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
1. Filter exams to show only the ones you want
2. Click the "Exportar" button
3. Google Calendar opens with the exam feed pre-filled in its "add calendar" dialog
4. Confirm to add it — your exams (and reminders) appear in Google Calendar and stay in sync

### Saving Calendar Views
1. Set up your desired filters
2. Click "Save View" button
3. Give your saved view a name
4. Access saved views from the "My Calendars" page

.