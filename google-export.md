# Google Calendar Export Feature

## Overview

The Google Calendar export feature allows users to subscribe to a live calendar feed that automatically syncs their filtered exam results with Google Calendar. The implementation uses the modern webcal subscription approach rather than single-event templates, providing a seamless experience with automatic updates and user-configurable reminders.

## Architecture

### Core Components

1. **ICS API Route** (`app/api/ical/route.ts`)
2. **Export Button** (`components/export-button.tsx`)
3. **ICS Generation Logic** (`lib/utils.ts`)
4. **Exam Data Mapping** (`utils/exam-mapper.ts`)
5. **Database Schema Support** (`actions/exam-actions.ts`, `types/exam.ts`)

## How It Works

### 1. User Interaction Flow

```
User clicks "Google Calendar" button
↓
Export button reads user's reminder preferences
↓
Builds webcal URL with filters + reminder settings
↓
Opens Google Calendar subscription dialog
↓
User confirms subscription
↓
Google Calendar periodically fetches the live ICS feed
```

### 2. URL Generation

The export button constructs a webcal URL like:
```
webcal://your-domain.com/api/ical?name=Recordatorios+de+exámenes&school=ETSINF&reminder=-P1D&reminder=-PT1H
```

Parameters:
- `name`: Calendar name for the subscription
- `school`, `degree`, `year`, `semester`, `subject`: Filter parameters (can be multiple)
- `reminder`: ISO-8601 negative durations for VALARM generation

### 3. ICS Feed Generation

The API route (`/api/ical`) processes the request:

1. **Parse Query Parameters**: Extracts filters and reminder settings
2. **Fetch Exam Data**: Queries database with applied filters
3. **Generate ICS Content**: Creates RFC 5545 compliant calendar data
4. **Return Response**: Serves with proper `text/calendar` headers

## Database Schema Integration

### New Field Support

The implementation now supports the enhanced database schema from the `25-26` table:

```sql
-- Key fields for calendar generation
exam_date          -- Date of the exam
exam_time          -- Time of the exam (nullable)
duration_minutes   -- Duration when exam_time is present
duration_day       -- Multi-day duration (P1D, P2D, etc.) when exam_time is null
```

### Event Type Handling

1. **Timed Events** (`exam_time` is present):
   ```
   DTSTART;TZID=Europe/Madrid:20241201T090000
   DTEND;TZID=Europe/Madrid:20241201T120000
   ```

2. **All-Day Events** (`exam_time` is null, no `duration_day`):
   ```
   DTSTART;VALUE=DATE:20241201
   DTEND;VALUE=DATE:20241202
   ```

3. **Multi-Day Events** (`exam_time` is null, `duration_day` = P2D):
   ```
   DTSTART;VALUE=DATE:20241201
   DTEND;VALUE=DATE:20241203  // +2 days
   SUMMARY:Matemáticas - Exam (2 días)
   ```

## Reminder System

### User Configuration

Users configure reminders in their profile settings (`app/profile/page.tsx`):

- **1 hora antes** → `-PT1H`
- **1 día antes** → `-P1D` 
- **1 semana antes** → `-P7D`

### VALARM Generation

For each enabled reminder, the system adds VALARM components:

```ics
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Reminder: Matemáticas exam in 1 day
TRIGGER:-P1D
END:VALARM
```

### Fallback Behavior

If no reminders are configured, defaults to 1 day and 1 hour before:
```javascript
if (reminderDurations.length === 0) {
  reminderDurations.push("-P1D", "-PT1H")
}
```

## Implementation Details

### 1. Export Button Logic (Updated for Popup Blockers)

```javascript
// Read user preferences
const { settings } = useSettings()

// Map to ISO-8601 durations
const reminderDurations: string[] = []
if (settings?.examReminders?.oneWeek) reminderDurations.push("-P7D")
if (settings?.examReminders?.oneDay) reminderDurations.push("-P1D")  
if (settings?.examReminders?.oneHour) reminderDurations.push("-PT1H")

// Build webcal URL with updated Google Calendar endpoint
const icalUrl = `${baseUrl}/api/ical?${params.toString()}`
const calendarFeed = icalUrl.replace(/^https?:/, "webcal:")
const googleCalendarUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarFeed)}`

// Use anchor element to avoid popup blockers
const openCalendar = () => {
  const link = document.createElement('a')
  link.href = googleCalendarUrl
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.setAttribute('aria-label', 'Abrir Google Calendar para suscribirse al calendario')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

openCalendar()
```

### 2. Duration Parsing

The API route includes robust ISO-8601 duration parsing:

```javascript
function parseReminderDurations(searchParams: URLSearchParams): number[] | undefined {
  const reminders = searchParams.getAll("reminder");
  const minutes: number[] = [];
  
  for (const iso of reminders) {
    if (!iso.startsWith("-P")) continue;
    const dur = iso.slice(1); // Remove '-'
    
    // Parse PnD, PTnH, PTnM patterns
    const dMatch = dur.match(/P(\d+)D/i);
    const tMatch = dur.match(/T([0-9HMS]+)/i);
    
    let totalMinutes = 0;
    if (dMatch) totalMinutes += parseInt(dMatch[1], 10) * 24 * 60;
    if (tMatch) {
      const h = tMatch[1].match(/(\d+)H/i);
      const m = tMatch[1].match(/(\d+)M/i);
      if (h) totalMinutes += parseInt(h[1], 10) * 60;
      if (m) totalMinutes += parseInt(m[1], 10);
    }
    
    if (totalMinutes > 0) minutes.push(totalMinutes);
  }
  
  return Array.from(new Set(minutes)).sort((a, b) => b - a);
}
```

### 3. Multi-Day Event Logic

```javascript
const hasTime = Boolean(exam.time && exam.time.trim().length);
const hasDurationDays = Boolean(exam.duration_day && exam.duration_day.trim().length);

if (hasTime) {
  // Timed event: use exam_time + duration_minutes
} else if (hasDurationDays) {
  // Multi-day event: parse P1D, P2D, etc.
  const dayMatch = exam.duration_day.match(/^P(\d+)D$/i);
  if (dayMatch) {
    dayCount = parseInt(dayMatch[1], 10);
    isMultiDay = dayCount > 1;
  }
} else {
  // All-day single event (default)
  dayCount = 1;
}
```

## Benefits

### For Users
- **Live Sync**: Calendar stays updated as filters change
- **Custom Reminders**: Configurable notification timing
- **Multi-Platform**: Works with Google, Apple, Outlook calendars
- **No Manual Import**: One-time subscription setup
- **Popup-Blocker Resistant**: Uses anchor elements to avoid popup blocking
- **Clear Instructions**: Step-by-step guidance for calendar subscription

### For Developers  
- **Scalable**: No server-side calendar API management
- **Secure**: No OAuth token storage required
- **Standards Compliant**: Uses RFC 5545 iCalendar format
- **Flexible**: Easy to extend with new features
- **Robust**: Multiple fallback approaches for opening calendar subscription

## Security Considerations

### Current Approach (Tokenless)
- URLs contain filter parameters directly
- No sensitive data exposure
- URLs can be shared/bookmarked
- Changes to filters require new subscription

### Future Enhancement (Tokenized)
For saved calendars, consider implementing:
```
webcal://domain.com/api/ics/<secure-token>
```

Benefits:
- Stable URLs for saved views
- Revocable access
- Usage tracking
- Enhanced security

## Testing

### Manual Testing Steps

1. **Basic Export** (Updated):
   - Apply filters (school, degree, etc.)
   - Click "Google Calendar" 
   - ✅ **NEW**: Verify instructions dialog appears with subscription steps
   - Check that Google Calendar opens in new tab/window
   - Confirm subscription and check events appear

2. **Popup Blocker Testing** (NEW):
   - Enable strict popup blocking in browser
   - Try Google Calendar export
   - Verify fallback "Abrir manualmente" button works
   - Test with different browsers (Chrome, Firefox, Safari, Edge)

3. **Reminder Testing**:
   - Configure different reminder settings in profile
   - Export calendar and verify VALARM components
   - Test with calendar client to confirm notifications

4. **Multi-Day Events**:
   - Test with exams that have `duration_day` set (P2D, P3D)
   - All day event spanning various days
   - Verify events span correct number of days
   - Check event titles include day count

5. **Edge Cases**:
   - No reminders configured (should use defaults)
   - No matching exams (should include placeholder event)
   - Invalid duration_day format (should fallback gracefully)
   - Network connectivity issues
   - Browser JavaScript disabled

### Automated Testing

Consider adding tests for:
- ISO-8601 duration parsing
- ICS content generation
- Multi-day event logic
- Filter parameter handling

## Browser Compatibility

### Webcal Protocol Support
- **Chrome/Edge**: Prompts to open with calendar app
- **Firefox**: May require extension for seamless webcal handling
- **Safari**: Native webcal support
- **Mobile**: Works with default calendar apps

### Fallback Strategies
- Detect webcal support
- Provide download link for .ics file
- Instructions for manual import

## Performance Considerations

### Caching Strategy
```javascript
headers: {
  "Content-Type": "text/calendar; charset=utf-8",
  "Cache-Control": "no-store, must-revalidate", // Ensure fresh data
  "Pragma": "no-cache",
}
```

### Database Optimization
- Indexed queries on filter fields
- Limit result sets for large datasets
- Efficient column selection

## Future Enhancements

### Planned Features
1. **Tokenized URLs** for saved calendar views
2. **Calendar Sharing** between users
3. **Custom Reminder Messages**
4. **Event Categories** with color coding
5. **Timezone Preferences** per user

### API Extensions
- Webhook notifications for exam changes
- Bulk calendar operations
- Integration with university systems
- Analytics and usage tracking

## Troubleshooting

### Common Issues

1. **Empty Calendar**:
   - Check filter parameters in URL
   - Verify exam data exists for filters
   - Confirm database connection

2. **No Reminders**:
   - Verify reminder parameters in URL
   - Check user settings configuration
   - Confirm VALARM generation in ICS

3. **Timezone Issues**:
   - All events use Europe/Madrid timezone
   - Multi-day events are DATE-only (no timezone)
   - Verify client timezone handling


