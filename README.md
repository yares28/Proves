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

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle between themes
- **Smooth Animations**: Fluid transitions and interactions
- **Accessible**: Built with accessibility in mind

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
- **Spring Boot**: Java backend service (optional)

### Integrations
- **Google Calendar API**: Export functionality
- **Google OAuth2**: Secure authentication for calendar access

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase account and project
- Google Cloud Console account (for Calendar integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Upv-Cal-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the project root:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Google Calendar Integration (optional)
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Google Calendar Setup

For Google Calendar export functionality, follow the detailed setup guide:
[Google Calendar Integration Setup](./docs/google-calendar-setup.md)

## Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   └── auth/              # Authentication components
├── lib/                   # Utility libraries and configurations
├── actions/               # Server actions for data fetching
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
├── docs/                  # Documentation
└── backend/               # Java Spring Boot backend (optional)
```

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

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm start
```

### Code Quality
```bash
npm run lint       # ESLint
npm run type-check # TypeScript checking
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Check the [documentation](./docs/)
- Open an issue on GitHub
- Contact the development team

## Roadmap

### Upcoming Features
- [ ] iCal export support
- [ ] Email notifications for exam reminders
- [ ] Mobile app version
- [ ] Integration with other university systems
- [ ] Collaborative calendar sharing
- [ ] Exam preparation tracking

### Recent Updates
- [x] Google Calendar export functionality
- [x] Enhanced filtering system
- [x] Improved mobile responsiveness
- [x] User authentication with Supabase
- [x] Saved calendar views 