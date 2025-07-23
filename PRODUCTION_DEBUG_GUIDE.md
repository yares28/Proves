# Production Debug Guide - Google Calendar Infinite Loading

## 🚨 **Current Issue**
- ✅ Fix works locally
- ❌ Production API returns 500 errors
- ❌ Google Calendar still shows infinite loading

## 🔍 **Potential Root Causes**

### **1. Import/Module Issues**
**Problem**: New imports might not be available in production build
**Solution**: Removed `validateICalContent` import that might be causing issues

### **2. Environment Variables Missing**
**Check in Vercel Dashboard**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

### **3. Database Connection Issues**
**Problem**: Production can't connect to Supabase
**Symptoms**: 500 errors when calling `getExams()`

### **4. Build/Deployment Issues**
**Problem**: Code not properly deployed or built
**Check**: Vercel build logs for errors

## 🧪 **Debugging Steps**

### **Step 1: Test Simple Endpoint**
```bash
# Test the new test endpoint
curl https://upv-cal.vercel.app/api/test-ical

# Expected: 200 OK with placeholder event
# If 500: Build/import issue
# If 404: Deployment issue
```

### **Step 2: Check Vercel Logs**
1. Go to Vercel Dashboard
2. Select your project
3. Go to "Functions" tab
4. Check logs for `/api/ical` function
5. Look for error messages

### **Step 3: Test Database Connection**
```bash
# If test endpoint works, try main endpoint
curl https://upv-cal.vercel.app/api/ical

# If still 500: Database connection issue
```

### **Step 4: Check Environment Variables**
In Vercel Dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://pzmmphrbkrmyyzjoitau.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=https://upv-cal.vercel.app
```

## 🔧 **Quick Fixes Applied**

### **1. Removed Problematic Imports**
```typescript
// REMOVED: import { validateICalContent } from '@/lib/ical-diagnostics'
// REMOVED: validateICalContent() calls
```

### **2. Added Test Endpoint**
```typescript
// NEW: /api/test-ical - Simple test without database calls
```

### **3. Enhanced Error Handling**
```typescript
// Added more detailed error logging
console.log('📄 [API] Generated iCal content length:', icalContent.length);
```

## 🎯 **Expected Results After Fix**

### **Test Endpoint**
```bash
curl https://upv-cal.vercel.app/api/test-ical
# Should return: 200 OK with placeholder event
```

### **Main Endpoint**
```bash
curl https://upv-cal.vercel.app/api/ical
# Should return: 200 OK with placeholder event or real exams
```

### **Google Calendar**
- ✅ No more infinite loading
- ✅ Shows "No Exams Found" or real exams
- ✅ Proper calendar import

## 🚨 **If Still Failing**

### **Check Build Logs**
Look for:
- TypeScript compilation errors
- Missing dependencies
- Import resolution failures

### **Check Function Logs**
Look for:
- Runtime errors
- Database connection failures
- Environment variable issues

### **Fallback Solution**
If all else fails, create a minimal working version:

```typescript
// Minimal /api/ical/route.ts
export async function GET() {
  const minimalCalendar = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//UPV Exam Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:test@upv-exam-calendar.com
DTSTART:20250724T120000
DTEND:20250724T130000
SUMMARY:Test Event
DESCRIPTION:Testing calendar export
END:VEVENT
END:VCALENDAR`;

  return new Response(minimalCalendar, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' }
  });
}
```

This minimal version should at least stop the infinite loading while we debug the full solution.

## ✅ **Success Criteria**

1. **Test endpoint returns 200** - Basic functionality works
2. **Main endpoint returns 200** - Database connection works  
3. **Google Calendar loads** - No more infinite loading
4. **Users see content** - Either placeholder or real exams

The key is to isolate whether it's a build issue, import issue, or database issue.