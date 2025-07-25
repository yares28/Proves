// Test the UTC fix for Google Calendar
console.log("=== Testing UTC Fix for Google Calendar ===");
console.log("Problem: Database has 15:00, Google Calendar shows 17:00");
console.log("Fix: Treat database times as UTC instead of local Madrid time");

// Simulate the updated parseExamDateTime function
function testUpdatedParseExamDateTime(dateStr, timeStr, timeZone) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  
  console.log(`\n=== Testing: ${dateStr} ${timeStr} ===`);
  console.log(`Parsed: year=${year}, month=${month}, day=${day}, hours=${hours}, minutes=${minutes}`);
  
  let examDate;
  if (timeZone === "Europe/Madrid") {
    // NEW: Database stores times in UTC, but they represent Madrid local time
    // Create the date as UTC, then Google Calendar will display it correctly
    examDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
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

const parseResult = testUpdatedParseExamDateTime(testExam.date, testExam.time, "Europe/Madrid");

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
  console.log("The UTC fix works correctly:");
  console.log("1. Database: 15:00 (treated as UTC)");
  console.log("2. Google Calendar receives: 15:00 UTC");
  console.log("3. Google Calendar displays: 15:00 Madrid time (17:00 UTC+2)");
  console.log("4. User sees: 15:00 in their Madrid timezone ✅");
} else {
  console.log("\n❌ Still not working correctly");
  console.log("Need to investigate further...");
}

// Test winter date too
console.log("\n=== Testing Winter Date ===");
testUpdatedParseExamDateTime("2025-01-15", "15:00", "Europe/Madrid");