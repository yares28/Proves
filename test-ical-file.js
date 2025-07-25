// Test script to debug iCal file generation and exam filtering
// Run this in the browser console on the my-calendars page

async function testICalFile() {
  console.log('🧪 Starting iCal file test...');
  
  // Get calendar ID from user input or try to find one on the page
  let calendarId = prompt('Enter a calendar ID to test (or leave empty to auto-detect):');
  
  if (!calendarId) {
    // Try to find calendar ID from the page
    const calendarElements = document.querySelectorAll('[data-calendar-id]');
    if (calendarElements.length > 0) {
      calendarId = calendarElements[0].getAttribute('data-calendar-id');
      console.log('📋 Auto-detected calendar ID:', calendarId);
    } else {
      console.log('❌ No calendar ID found. Please provide one manually.');
      return;
    }
  }
  
  console.log('🔍 Testing calendar ID:', calendarId);
  
  try {
    // Test the iCal endpoint
    console.log('📡 Fetching iCal file...');
    const response = await fetch(`/api/calendars/${calendarId}/ical`);
    
    console.log('📄 Response status:', response.status);
    console.log('📄 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ iCal request failed:', response.statusText);
      console.error('Error details:', errorText);
      return;
    }
    
    const icalContent = await response.text();
    console.log('📄 iCal content length:', icalContent.length);
    
    // Parse and analyze the iCal content
    const lines = icalContent.split('\n');
    const events = [];
    let currentEvent = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (trimmedLine === 'END:VEVENT' && currentEvent) {
        events.push(currentEvent);
        currentEvent = null;
      } else if (currentEvent && trimmedLine.includes(':')) {
        const [key, ...valueParts] = trimmedLine.split(':');
        const value = valueParts.join(':');
        currentEvent[key] = value;
      }
    }
    
    console.log('📅 Number of events found:', events.length);
    
    if (events.length === 0) {
      console.log('⚠️ No events found in iCal file!');
      console.log('📄 iCal content preview:');
      console.log(icalContent.substring(0, 1000));
      
      // This indicates the filter issue - let's debug further
      console.log('🔍 Debugging filter issue...');
      
      // Try to access the calendar data from the page state
      console.log('🔍 Checking page state for calendar data...');
      
    } else {
      console.log('✅ Events found! Calendar is working correctly.');
      
      // Show sample events
      console.log('📋 Sample events:');
      events.slice(0, 5).forEach((event, index) => {
        console.log(`Event ${index + 1}:`, {
          summary: event.SUMMARY,
          start: event.DTSTART,
          end: event.DTEND,
          description: event.DESCRIPTION,
          location: event.LOCATION
        });
      });
      
      // Group events by month
      const eventsByMonth = {};
      events.forEach(event => {
        if (event.DTSTART) {
          const year = event.DTSTART.substring(0, 4);
          const month = event.DTSTART.substring(4, 6);
          const monthKey = `${year}-${month}`;
          
          if (!eventsByMonth[monthKey]) {
            eventsByMonth[monthKey] = 0;
          }
          eventsByMonth[monthKey]++;
        }
      });
      
      console.log('📊 Events by month:', eventsByMonth);
    }
    
    // Test direct exam fetching if possible
    console.log('🔍 Testing direct exam fetching...');
    
    // Check if we can access the getExams function
    if (typeof window !== 'undefined' && window.getExams) {
      console.log('📡 Testing getExams function directly...');
      try {
        const allExams = await window.getExams({});
        console.log('📊 Total exams from getExams():', allExams.length);
        
        if (allExams.length > 0) {
          console.log('📋 Sample exam data:', allExams.slice(0, 3));
        }
      } catch (error) {
        console.error('❌ Error calling getExams:', error);
      }
    } else {
      console.log('⚠️ getExams function not available in window scope');
    }
    
  } catch (error) {
    console.error('❌ Error testing iCal file:', error);
  }
  
  console.log('🧪 Test completed. Check the console output above for details.');
}

// Auto-run the test
testICalFile();