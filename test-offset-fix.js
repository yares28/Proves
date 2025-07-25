// Test the offset fix for Google Calendar
console.log("=== Testing Offset Fix for Google Calendar ===");
console.log("Problem: Database has 15:00, Google Calendar shows 17:00");
console.log("Fix: Subtract Madrid offset when creating UTC time");

// Simulate the updated parseExamDateTime function
function testOffsetFix(dateStr, timeStr, timeZone) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  
  console.log(`\n=== Testing: ${dateStr} ${timeStr} ===`);
  console.log(`Parsed: year=${year}, month=${month}, day=${day}, hours=${hours}, minutes=${minutes}`);
  
  // Helper function to check if a date is in DST for Madrid timezone
  function isDateInDST(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    // Helper function to get last Sunday of a month
    function getLastSundayOfMonth(year, month) {
      const lastDay = new Date(year, month + 1, 0);
      const lastSunday = new Date(lastDay);
      lastSunday.setDate(lastDay.getDate() - lastDay.getDay());
      return lastSunday;
    }

    // DST starts last Sunday in March and ends last Sunday in October
    const marchLastSunday = getLastSundayOfMonth(year, 2); // March
    const octoberLastSunday = getLastSundayOfMonth(year, 9); // October

    // Check if date is in DST period (CEST = UTC+2)
    return (
      (month > 2 && month < 9) || // April to September
      (month === 2 && day >= marchLastSunday.getDate()) || // March after last Sunday
      (month === 9 && day < octoberLastSunday.getDate()) // October before last Sunday
    );
  }
  
  let examDate;
  if (timeZone === "Europe/Madrid") {
    // NEW FIX: Database stores times as they should appear in Madrid timezone (15:00 = 3 PM Madrid)
    // We need to create a UTC time that, when Google Calendar converts to Madrid time, shows 15:00
    // So we subtract the Madrid offset from the time
    const tempDate = new Date(year, month - 1, day);
    const isDST = isDateInDST(tempDate);
    const madridOffsetHours = isDST ? 2 : 1; // UTC+2 in summer, UTC+1 in winter
    
    console.log(`Date ${dateStr} is in DST: ${isDST}`);
    console.log(`Madrid offset: UTC+${madridOffsetHours}`);
    console.log(`Subtracting ${madridOffsetHours} hours from ${hours}:${minutes}`);
    console.log(`Adjusted time: ${hours - madridOffsetHours}:${minutes}`);
    
    // Create UTC time by subtracting Madrid offset
    examDate = new Date(
      Date.UTC(year, month - 1, day, hours - madridOffsetHours, minutes, 0)
    );
  } else {
    examDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  }
  
  console.log("Created Date object:", examDate);
  console.log("Date.toString():", examDate.toString());
  console.log("Date.toISOString():", examDate.toISOString());
  console.log("Date.toLocaleString():", examDate.toLocaleString());
  console.log("Date.toLocaleString('en-US', {timeZone: 'Europe/Madrid'}):", 
    examDate.toLocaleString('en-US', {timeZone: 'Europe/Madrid'}));
  
  return { start: examDate, isValid: true };
}

// Test the problematic case
const testExam = {
  date: "2025-07-25", // Today's date (summer, UTC+2)
  time: "15:00", // 3 PM - should stay 3 PM in Madrid
};

console.log("Database stores: 15:00 (should appear as 15:00 in Madrid timezone)");
console.log("Expected: Google Calendar should show 15:00 Madrid time");

const parseResult = testOffsetFix(testExam.date, testExam.time, "Europe/Madrid");

// Simulate Google Calendar URL generation
console.log("\n=== Google Calendar URL Generation ===");
const startTime = parseResult.start;
const endTime = new Date(startTime);
endTime.setMinutes(startTime.getMinutes() + 120); // 2 hours duration

console.log("Start time:", startTime.toISOString());
console.log("End time:", endTime.toISOString());

// Format for Google Calendar
const formatGoogleDate = (date) => {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
};

const startFormatted = formatGoogleDate(startTime);
const endFormatted = formatGoogleDate(endTime);

console.log("Google Calendar start format:", startFormatted);
console.log("Google Calendar end format:", endFormatted);

// What Google Calendar will interpret this as
console.log("\n=== Google Calendar Interpretation ===");
const googleStartTime = new Date(
  startFormatted.substring(0, 4) + '-' +
  startFormatted.substring(4, 6) + '-' +
  startFormatted.substring(6, 8) + 'T' +
  startFormatted.substring(9, 11) + ':' +
  startFormatted.substring(11, 13) + ':' +
  startFormatted.substring(13, 15) + 'Z'
);

console.log("Google interprets start as (UTC):", googleStartTime.toISOString());
console.log("Google shows in Madrid timezone:", 
  googleStartTime.toLocaleString('en-US', {timeZone: 'Europe/Madrid'}));

// Check if this fixes the 17:00 issue
const madridHour = parseInt(googleStartTime.toLocaleString('en-US', {
  timeZone: 'Europe/Madrid',
  hour: '2-digit',
  hour12: false
}));

console.log("\n=== Analysis ===");
console.log(`Google Calendar will show: ${madridHour}:00`);
console.log(`Expected: 15:00`);
console.log(`Fix status: ${madridHour === 15 ? '✅ FIXED - shows 15:00' : '❌ Still broken - shows ' + madridHour + ':00'}`);

if (madridHour === 15) {
  console.log("\n🎉 SUCCESS!");
  console.log("The offset fix works correctly:");
  console.log("1. Database: 15:00 (Madrid time)");
  console.log("2. Subtract UTC+2 offset: 15:00 - 2 = 13:00");
  console.log("3. Create UTC time: 13:00 UTC");
  console.log("4. Google Calendar receives: 13:00 UTC");
  console.log("5. Google Calendar converts to Madrid: 13:00 UTC + 2 = 15:00 Madrid ✅");
} else {
  console.log("\n❌ Still not working correctly");
  console.log("Need to investigate further...");
}

// Test winter date too
console.log("\n=== Testing Winter Date (UTC+1) ===");
testOffsetFix("2025-01-15", "15:00", "Europe/Madrid");