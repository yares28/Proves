# Google Calendar Export Flow Documentation

## Overview
This document describes the complete flow of how users export their saved exam calendars to Google Calendar. The process creates a **live subscription** to an iCal feed, not a one-time export.

## Flow Diagram

```
User Click → UI Component → Export Function → URL Generation → Google Calendar Redirect → API Processing → Live Subscription
```

## Detailed Flow Breakdown

### 1. Entry Point - User Action
**File:** `app/my-calendars/page.tsx`  
**Lines:** 813-823  
**Component:** DropdownMenuItem in calendar card

```tsx
<DropdownMenuItem
  onClick={() => exportExamsToGoogleCalendar(calendar)}
  className="flex items-center gap-2"
>
  <Image
    src="/google-cal.png"
    alt="Google Calendar"
    width={16}
    height={16}
  />
  <span>Google Calendar</span>
</DropdownMenuItem>
```

**What starts:** User clicks the "Google Calendar" option in the dropdown menu for a saved calendar.

---

### 2. Main Export Function
**File:** `app/my-calendars/page.tsx`  
**Lines:** 410-491  
**Function:** `exportExamsToGoogleCalendar(calendar: SavedCalendar)`

#### 2.1 URL Base Determination
**Lines:** 412-416

```tsx
let baseUrl = window.location.origin;
if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://upv-cal.vercel.app";
}
```

- **Input:** Current window origin
- **Output:** Production URL (handles localhost development)

#### 2.2 Filter Normalization
**Lines:** 418-419

```tsx
const normalizedFilters = normalizeSavedFilters(calendar.filters);
```

- **Input:** Saved calendar filters (plural keys like `schools`, `degrees`)
- **Output:** Normalized filters (singular keys like `school`, `degree`)

#### 2.3 Reminder Settings Processing
**Lines:** 421-429

```tsx
const reminderDurations: string[] = [];
if (settings?.examReminders?.oneWeek) reminderDurations.push("-P7D");
if (settings?.examReminders?.oneDay) reminderDurations.push("-P1D");
if (settings?.examReminders?.oneHour) reminderDurations.push("-PT1H");
if (reminderDurations.length === 0) {
  reminderDurations.push("-P1D", "-PT1H");
}
```

- **Input:** User settings from context
- **Output:** ISO-8601 duration strings for calendar reminders

#### 2.4 iCal URL Generation (Primary Path)
**Lines:** 431-443

```tsx
try {
  const { generateUPVTokenUrl } = await import("@/lib/utils");
  const tokenPath = await generateUPVTokenUrl(normalizedFilters, calendar.name);
  icalUrl = `${baseUrl}${tokenPath}`;
  
  if (reminderDurations.length > 0) {
    const url = new URL(icalUrl);
    reminderDurations.forEach((r) => url.searchParams.append("reminder", r));
    icalUrl = url.toString();
  }
}
```

- **Input:** Normalized filters + calendar name
- **Output:** Complete iCal URL with query parameters

#### 2.5 Fallback Path
**Lines:** 444-455

```tsx
catch (error) {
  console.warn("Token approach failed, falling back to direct URL:", error);
  const { generateUPVTokenUrl } = await import("@/lib/utils");
  const directPath = await generateUPVTokenUrl(normalizedFilters, calendar.name);
  icalUrl = `${baseUrl}${directPath}`;
  
  const url = new URL(icalUrl);
  reminderDurations.forEach((r) => url.searchParams.append("reminder", r));
  icalUrl = url.toString();
}
```

- **Input:** Same as primary path
- **Output:** Same as primary path (redundant fallback)

---

### 3. URL Generation Function
**File:** `lib/utils.ts`  
**Lines:** 822-869  
**Function:** `generateUPVTokenUrl(filters, calendarName)`

#### 3.1 Query Parameter Building
**Lines:** 831-851

```tsx
const params = new URLSearchParams();
params.set("name", calendarName);

if (filters.school && filters.school.length > 0) {
  filters.school.forEach((school) => params.append("school", school));
}
if (filters.degree && filters.degree.length > 0) {
  filters.degree.forEach((degree) => params.append("degree", degree));
}
// ... similar for year, semester, subject
```

- **Input:** Normalized filter object + calendar name
- **Output:** URLSearchParams object with encoded parameters

#### 3.2 URL Construction
**Lines:** 865-866

```tsx
const directUrl = `/api/ical?${queryString}`;
return directUrl;
```

- **Input:** Query string from URLSearchParams
- **Output:** Complete API path (e.g., `/api/ical?name=My%20Calendar&school=ETSINF`)

---

### 4. URL Transformation for Google Calendar
**File:** `app/my-calendars/page.tsx`  
**Lines:** 457-459

```tsx
const calendarFeed = icalUrl.replace(/^https?:/, "webcal:");
const primaryGoogleCalendarUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarFeed)}`;
```

- **Input:** HTTP/HTTPS iCal URL
- **Output:** 
  - `calendarFeed`: WebCal protocol URL (`webcal://...`)
  - `primaryGoogleCalendarUrl`: Google Calendar subscription URL

---

### 5. Google Calendar Redirect
**File:** `app/my-calendars/page.tsx`  
**Lines:** 470-477

```tsx
const link = document.createElement('a');
link.href = primaryGoogleCalendarUrl;
link.target = '_blank';
link.rel = 'noopener noreferrer';
link.setAttribute('aria-label', `Abrir Google Calendar para suscribirse al calendario ${calendar.name}`);
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
```

- **Input:** Google Calendar subscription URL
- **Output:** Programmatic redirect to Google Calendar

---

### 6. API Route Processing
**File:** `app/api/ical/route.ts`  
**Lines:** 1-277  
**Route:** `GET /api/ical`

#### 6.1 Filter Building
**Lines:** 6-43  
**Function:** `buildFilters(searchParams: URLSearchParams)`

```tsx
function buildFilters(searchParams: URLSearchParams): Record<string, string[]> {
  // 1) Short token takes precedence if provided
  const token = searchParams.get("t");
  if (token) {
    try {
      const tokenData = decodeShortToken(token);
      if (tokenData && tokenData.filters) {
        return tokenData.filters;
      }
    } catch (error) {
      console.error("Failed to decode short token:", error);
    }
  }

  // 2) Packed filters take precedence if provided
  const packed = searchParams.get("p");
  if (packed) {
    try {
      const json = decodePackedFilters(packed);
      if (json && typeof json === "object") {
        return normalizeFilterKeys(json as Record<string, string[]>);
      }
    } catch {
      // Fall through to regular params if decoding fails
    }
  }

  // 3) Regular query parameters
  const multiParams = ["school", "degree", "year", "semester", "subject", "acronym"] as const;
  const filters: Record<string, string[]> = {};
  for (const key of multiParams) {
    const values = searchParams.getAll(key);
    if (values && values.length > 0) filters[key] = values.filter(Boolean);
  }
  return filters;
}
```

- **Input:** URL search parameters
- **Output:** Normalized filter object

#### 6.2 Exam Data Fetching
**Lines:** 80-90 (approximate)

```tsx
const exams = await getExams(filters);
```

- **Input:** Normalized filters
- **Output:** Array of exam objects from database

#### 6.3 iCal Content Generation
**Lines:** 100-110 (approximate)

```tsx
const icalContent = generateICalContent(exams, {
  calendarName: calendarName || "UPV Exams",
  reminderMinutes: reminderMinutes,
  timeZone: "Europe/Madrid",
  useUPVFormat: true
});
```

- **Input:** Exam data + options
- **Output:** iCalendar formatted string

#### 6.4 Response Headers
**Lines:** 120-130 (approximate)

```tsx
return new NextResponse(icalContent, {
  status: 200,
  headers: {
    "Content-Type": "text/calendar; charset=utf-8",
    "Content-Disposition": `attachment; filename="${calendarName || 'upv-exams'}.ics"`,
    "Cache-Control": "public, max-age=300, s-maxage=300",
  },
});
```

- **Input:** iCal content + calendar name
- **Output:** HTTP response with proper calendar headers

---

### 7. iCal Content Generation
**File:** `lib/utils.ts`  
**Lines:** 150-428  
**Function:** `generateICalContent(exams, options)`

#### 7.1 UPV-Compatible Format
**Lines:** 503-760  
**Function:** `generateUPVCompatibleICalContent(exams, calendarName)`

- **Input:** Exam array + calendar name
- **Output:** UPV-formatted iCalendar string with proper timezone handling

#### 7.2 Standard iCal Format
**Lines:** 165-428

- **Input:** Exam array + options
- **Output:** Standard iCalendar string with timezone components

---

### 8. User Feedback
**File:** `app/my-calendars/page.tsx`  
**Lines:** 479-482

```tsx
toast({
  title: "Redirigiendo a Google Calendar",
  description: "Se abrirá Google Calendar con el enlace de suscripción para " + calendar.name,
});
```

- **Input:** Calendar name
- **Output:** User notification toast

---

## File Structure Summary

```
app/
├── my-calendars/
│   └── page.tsx                    # Main UI and export function (lines 410-491)
└── api/
    └── ical/
        └── route.ts                # API endpoint for iCal generation (lines 1-277)

lib/
└── utils.ts                        # URL generation and iCal content functions (lines 150-869)

components/
└── export-button.tsx               # Alternative export component (lines 1-232)
```

## Key Methods and Their Locations

| Method | File | Lines | Purpose |
|--------|------|-------|---------|
| `exportExamsToGoogleCalendar` | `app/my-calendars/page.tsx` | 410-491 | Main export orchestration |
| `generateUPVTokenUrl` | `lib/utils.ts` | 822-869 | URL generation with query params |
| `buildFilters` | `app/api/ical/route.ts` | 6-43 | Parse URL parameters to filters |
| `generateICalContent` | `lib/utils.ts` | 150-428 | Generate iCalendar content |
| `generateUPVCompatibleICalContent` | `lib/utils.ts` | 503-760 | UPV-specific iCal format |
| `normalizeSavedFilters` | `app/my-calendars/page.tsx` | 50-72 | Convert plural to singular keys |

## Data Flow Summary

1. **User Action** → UI Component (`app/my-calendars/page.tsx:813-823`)
2. **Export Function** → `exportExamsToGoogleCalendar()` (`app/my-calendars/page.tsx:410-491`)
3. **URL Generation** → `generateUPVTokenUrl()` (`lib/utils.ts:822-869`)
4. **URL Transformation** → HTTP → WebCal → Google Calendar URL (`app/my-calendars/page.tsx:457-459`)
5. **Browser Redirect** → Programmatic link click (`app/my-calendars/page.tsx:470-477`)
6. **API Processing** → `/api/ical` route (`app/api/ical/route.ts:1-277`)
7. **iCal Generation** → `generateICalContent()` (`lib/utils.ts:150-428`)
8. **Live Subscription** → Google Calendar receives and displays calendar

## Important Notes

- This creates a **live subscription**, not a one-time export
- The calendar stays synced with the UPV exam database
- Uses WebCal protocol for calendar subscriptions
- Handles both UPV-compatible and standard iCal formats
- Includes proper timezone handling for Europe/Madrid
- Supports custom reminder settings from user preferences
