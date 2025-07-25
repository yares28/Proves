// Debug script to test calendar filter saving and retrieval
// Run this in the browser console on the my-calendars page

async function debugCalendarFilters() {
  console.log('🔍 Starting calendar filter debug...');
  
  // Get the first calendar from the page
  const calendars = document.querySelectorAll('[data-calendar-id]');
  if (calendars.length === 0) {
    console.log('❌ No calendars found on page');
    return;
  }
  
  const firstCalendar = calendars[0];
  const calendarId = firstCalendar.getAttribute('data-calendar-id');
  
  console.log('📋 Testing calendar:', calendarId);
  
  // Test the API endpoint directly
  try {
    const response = await fetch(`/api/calendars/${calendarId}/ical`);
    const icalContent = await response.text();
    
    console.log('📄 iCal Response Status:', response.status);
    console.log('📄 iCal Content Length:', icalContent.length);
    
    // Count events in the iCal content
    const eventCount = (icalContent.match(/BEGIN:VEVENT/g) || []).length;
    console.log('📅 Number of events in iCal:', eventCount);
    
    // Show first few lines of content
    console.log('📄 iCal Content Preview:');
    console.log(icalContent.substring(0, 500));
    
    if (eventCount === 0) {
      console.log('⚠️ No events found in iCal - this indicates the filter issue');
    }
    
  } catch (error) {
    console.error('❌ Error fetching iCal:', error);
  }
}

// Run the debug function
debugCalendarFilters();