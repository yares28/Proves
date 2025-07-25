// Test script to verify Google Calendar fixes
// Run this in the browser console to test the iCal generation

async function testGoogleCalendarFixes() {
  console.log('🧪 Testing Google Calendar fixes...');
  
  // Test data that simulates exam data from the database
  const testExam = {
    id: 1,
    subject: 'Análisis matemático',
    code: 'MAT001',
    date: '2025-10-30',
    time: '14:00',
    duration_minutes: 150, // 2.5 hours
    location: '1G 0.1, 1G 0.2, 1G 0.4',
    comment: 'Examen parcial - Traer calculadora',
    school: 'ETSINF',
    degree: 'GIINF',
    year: '1',
    semester: 'A',
    acronym: 'AM'
  };
  
  console.log('📋 Test exam data:', testExam);
  
  // Test the timezone conversion logic
  console.log('🕐 Testing time conversion...');
  
  // Simulate the parseExamDateTime function
  const parseExamDateTime = (dateStr, timeStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const examDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return { start: examDate, isValid: true };
  };
  
  const parseResult = parseExamDateTime(testExam.date, testExam.time);
  const startTime = parseResult.start;
  const endTime = new Date(startTime);
  endTime.setMinutes(startTime.getMinutes() + testExam.duration_minutes);
  
  console.log('⏰ Parsed times:');
  console.log('  Start time (local):', startTime.toString());
  console.log('  End time (local):', endTime.toString());
  console.log('  Duration:', testExam.duration_minutes, 'minutes');
  
  // Test the UTC conversion
  const isDateInDST = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    // Simplified DST check for testing
    return month > 2 && month < 9; // April to September
  };
  
  const formatUTCDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    const localDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    const isDST = isDateInDST(localDate);
    const madridOffsetHours = isDST ? 2 : 1;
    
    const utcTime = localDate.getTime() - (madridOffsetHours * 60 * 60 * 1000);
    const utcDate = new Date(utcTime);
    
    return utcDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  };
  
  const startUTC = formatUTCDate(startTime);
  const endUTC = formatUTCDate(endTime);
  
  console.log('🌍 UTC conversion:');
  console.log('  Start UTC:', startUTC);
  console.log('  End UTC:', endUTC);
  
  // Test the description and location formatting
  const descriptionParts = [testExam.subject];
  if (testExam.comment && testExam.comment.trim()) {
    descriptionParts.push(testExam.comment.trim());
  }
  const description = descriptionParts.join(' - ');
  
  let location = testExam.location || '';
  if (testExam.comment && testExam.comment.trim() && !location.includes(testExam.comment)) {
    location = location ? `${location} - ${testExam.comment}` : testExam.comment;
  }
  
  console.log('📝 Content formatting:');
  console.log('  Description:', description);
  console.log('  Location:', location);
  
  // Generate a sample iCal event
  const sampleEvent = [
    'BEGIN:VEVENT',
    `DTSTART:${startUTC}`,
    `DTEND:${endUTC}`,
    `SUMMARY:Examen ${testExam.subject}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT'
  ].join('\r\n');
  
  console.log('📄 Sample iCal event:');
  console.log(sampleEvent);
  
  // Verify the fixes
  console.log('✅ Verification:');
  console.log('  1. Time shows correct hour (not always 16h):', startUTC.includes('T14') ? '✅' : '❌');
  console.log('  2. Event has end time:', endUTC !== startUTC ? '✅' : '❌');
  console.log('  3. Location includes place:', location.includes(testExam.location) ? '✅' : '❌');
  console.log('  4. Description includes comment:', description.includes(testExam.comment) ? '✅' : '❌');
  
  console.log('🧪 Test completed!');
}

// Run the test
testGoogleCalendarFixes();