// Test script to debug calendar save/load issue
// Run this in the browser console on the my-calendars page

async function testCalendarSaveLoad() {
  console.log('🧪 Starting calendar save/load test...');
  
  // First, let's check what calendars are available
  const calendarCards = document.querySelectorAll('[data-testid="calendar-card"], .calendar-card, [class*="calendar"]');
  console.log('📋 Found calendar elements:', calendarCards.length);
  
  // Try to find calendar data in the page state
  const reactFiberKey = Object.keys(document.querySelector('#__next') || {}).find(key => key.startsWith('__reactFiber'));
  if (reactFiberKey) {
    console.log('⚛️ React fiber found, attempting to access component state...');
  }
  
  // Test the API directly with a known calendar ID
  // You'll need to replace 'your-calendar-id' with an actual ID from your database
  const testCalendarId = prompt('Enter a calendar ID to test (check your database or network tab):');
  
  if (testCalendarId) {
    console.log('🔍 Testing calendar ID:', testCalendarId);
    
    try {
      // Test the iCal endpoint
      const icalResponse = await fetch(`/api/calendars/${testCalendarId}/ical`);
      console.log('📄 iCal Response Status:', icalResponse.status);
      
      if (icalResponse.ok) {
        const icalContent = await icalResponse.text();
        console.log('📄 iCal Content Length:', icalContent.length);
        
        // Count events
        const eventCount = (icalContent.match(/BEGIN:VEVENT/g) || []).length;
        console.log('📅 Number of events:', eventCount);
        
        if (eventCount === 0) {
          console.log('⚠️ No events found - this confirms the filter issue');
          console.log('📄 iCal Content Preview:');
          console.log(icalContent.substring(0, 500));
        } else {
          console.log('✅ Events found! The calendar is working correctly.');
          // Show first event as sample
          const firstEvent = icalContent.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/);
          if (firstEvent) {
            console.log('📋 Sample event:');
            console.log(firstEvent[0]);
          }
        }
      } else {
        console.error('❌ iCal request failed:', icalResponse.statusText);
        const errorText = await icalResponse.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('❌ Error testing calendar:', error);
    }
  }
  
  // Test the exam-actions directly if possible
  console.log('🔍 Testing exam fetching with different filter formats...');
  
  // Test with empty filters
  try {
    const response = await fetch('/api/test-exam-fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters: {} })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('📊 All exams count:', result.count);
    }
  } catch (error) {
    console.log('⚠️ Direct exam test not available (expected in production)');
  }
  
  console.log('🧪 Test completed. Check the console output above for details.');
}

// Run the test
testCalendarSaveLoad();