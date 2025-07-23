# Production Deployment Checklist - Google Calendar Fix

## 🚨 **Current Issue**

- ✅ Fix implemented locally (placeholder events prevent infinite loading)
- ❌ Production API returns 500 errors
- ❌ Google Calendar cannot fetch .ics files → infinite loading continues

## 🚀 **Deployment Steps**

### **1. Verify Local Fix is Working**

```bash
# Test local API (should work)
curl http://localhost:3000/api/ical
# Expected: 200 OK with placeholder event
```

### **2. Deploy to Production**

```bash
# Commit and push changes
git add .
git commit -m "fix: Add placeholder events to prevent Google Calendar infinite loading

- Add placeholder event generation when no exams found
- Fix timezone handling and text escaping
- Update environment variables
- Add comprehensive tests"

git push origin main
```

### **3. Verify Production Deployment**

```bash
# Test production API (should work after deployment)
curl https://upv-cal.vercel.app/api/ical
# Expected: 200 OK with placeholder event

# Test with filters
curl "https://upv-cal.vercel.app/api/ical?filters=%7B%7D&name=UPV%20Exams"
# Expected: 200 OK with placeholder event
```

### **4. Test Google Calendar Integration**

1. Visit https://upv-cal.vercel.app
2. Click "Add to Google Calendar"
3. Verify Google Calendar loads without infinite spinner
4. Should show "No Exams Found" event

## 🔍 **Debugging Production Issues**

If deployment still shows 500 errors, check:

### **Environment Variables**

Ensure these are set in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL=https://upv-cal.vercel.app`

### **Build Logs**

Check Vercel build logs for:

- TypeScript compilation errors
- Missing dependencies
- Runtime errors

### **Function Logs**

Check Vercel function logs for:

- Database connection errors
- Import/export errors
- Runtime exceptions

## 📊 **Expected Results After Deployment**

### **API Endpoints**

```bash
# General calendar
GET https://upv-cal.vercel.app/api/ical
→ 200 OK with placeholder event

# Filtered calendar
GET https://upv-cal.vercel.app/api/ical?filters=%7B%7D&name=UPV%20Exams
→ 200 OK with placeholder event

# Saved calendar (if ID exists)
GET https://upv-cal.vercel.app/api/calendars/[id]/ical
→ 200 OK with placeholder event
```

### **Google Calendar Integration**

- ✅ No more infinite loading
- ✅ Shows "No Exams Found" event when no data
- ✅ Shows actual exams when data available
- ✅ Proper timezone handling

## 🎯 **Verification Commands**

```bash
# Quick verification script
echo "Testing production API..."

# Test basic endpoint
curl -s -o /dev/null -w "%{http_code}" https://upv-cal.vercel.app/api/ical
# Expected: 200

# Test with content
curl -s https://upv-cal.vercel.app/api/ical | grep -q "BEGIN:VEVENT"
echo $? # Expected: 0 (found)

# Test placeholder event
curl -s https://upv-cal.vercel.app/api/ical | grep -q "No Exams Found"
echo $? # Expected: 0 (found)
```

## ✅ **Success Criteria**

The deployment is successful when:

1. **API returns 200** - No more 500 errors
2. **Contains events** - Always has at least placeholder event
3. **Google Calendar works** - No infinite loading
4. **Users see feedback** - "No Exams Found" or actual exams

## 🚨 **If Still Failing After Deployment**

Check these common issues:

1. **Database Connection**: Verify Supabase credentials
2. **Import Errors**: Check for missing dependencies
3. **TypeScript Errors**: Verify all types are correct
4. **Environment Variables**: Ensure all vars are set in Vercel
5. **Build Process**: Check if build completes successfully

The fix is ready - it just needs to be deployed to production!
