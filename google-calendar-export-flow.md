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
**Component:** DropdownMenuItem in calendar card


**What starts:** User clicks the "Google Calendar" option in the dropdown menu for a saved calendar.

---

### 2. Main Export Function
**File:** `app/my-calendars/page.tsx`  
**Function:** `exportExamsToGoogleCalendar(calendar: SavedCalendar)`

#### 2.1 URL Base Determination


- **Input:** Current window origin
- **Output:** Production URL (handles localhost development)

#### 2.2 Filter Normalization


- **Input:** Saved calendar filters (plural keys like `schools`, `degrees`)
- **Output:** Normalized filters (singular keys like `school`, `degree`)
- Check database.md for in depth understanding of database columns

#### 2.3 Reminder Settings Processing

- **Input:** User settings from context
- **Output:** ISO-8601 duration strings for calendar reminders

#### 2.4 iCal URL Generation 

- **Input:** Normalized filters + calendar name
- **Output:** Complete iCal URL with query parameters


---

### 3. URL Generation Function
**File:** `lib/utils.ts` 
**Function:** `generateUPVTokenUrl(filters, calendarName)`

#### 3.1 Query Parameter Building


- **Input:** Normalized filter object + calendar name
- **Output:** URLSearchParams object with encoded parameters

#### 3.2 URL Construction

- **Input:** Query string from URLSearchParams
- **Output:** Complete API path (e.g., `/api/ical?name=My%20Calendar&school=24-25`)

---

### 4. URL Transformation for Google Calendar
**File:** `app/my-calendars/page.tsx`  


- **Input:** HTTP/HTTPS iCal URL
- **Output:** 
  - `calendarFeed`: WebCal protocol URL (`webcal://...`)
  - `primaryGoogleCalendarUrl`: Google Calendar subscription URL

---

### 5. Google Calendar Redirect
**File:** `app/my-calendars/page.tsx`  

- **Input:** Google Calendar subscription URL
- **Output:** Programmatic redirect to Google Calendar

---

### 6. API Route Processing
**File:** `app/api/ical/route.ts`  
**Route:** `GET /api/ical`

#### 6.1 Filter Building 
**Function:** `buildFilters(searchParams: URLSearchParams)`

- **Input:** URL search parameters
- **Output:** Normalized filter object

#### 6.2 Exam Data Fetching

- **Input:** Normalized filters
- **Output:** Array of exam objects from database

#### 6.3 iCal Content Generation

- **Input:** Exam data + options
- **Output:** iCalendar formatted string

#### 6.4 Response Headers

- **Input:** iCal content + calendar name
- **Output:** HTTP response with proper calendar headers

---

### 7. iCal Content Generation

**Function:** `generateICalContent(exams, options)`

---

### 8. User Feedback
**File:** `app/my-calendars/page.tsx`  


- **Input:** Calendar name
- **Output:** User notification toast

---


## Data Flow Summary

1. **User Action** → UI Component (`app/my-calendars/page.tsx`)
2. **Export Function** → `exportExamsToGoogleCalendar()` (`app/my-calendars/page.tsx`)
3. **URL Generation** → `generateUPVTokenUrl()` 
4. **URL Transformation** → HTTP → WebCal → Google Calendar URL (`app/my-calendars/page.tsx`)
5. **Browser Redirect** → Programmatic link click (`app/my-calendars/page.tsx`)
6. **API Processing** → `/api/ical` route (`app/api/ical/route.ts`)
7. **iCal Generation** → `generateICalContent()` 
8. **Live Subscription** → Google Calendar receives and displays calendar

## Important Notes

- This creates a **live subscription**, not a one-time export
- The calendar stays synced with the UPV exam database
- Uses WebCal protocol for calendar subscriptions
- Handles both UPV-compatible and standard iCal formats
- Includes proper timezone handling for Europe/Madrid
- Supports custom reminder settings from user preferences
- The url has to look like this one but modifies for my web app "http://www.google.com/calendar/render?cid=http://www.upv.es/ical/BEFD95D28D9C3CFA96E66F3597C6B04FE38B84B8D77E2DAA0C32E3C199650D25D8F679B7941DF185" changing www.upv.es with my domain, etc
