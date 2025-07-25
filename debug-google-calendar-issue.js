// Debug the Google Calendar 17h vs 15h issue
console.log("=== Debugging Google Calendar Time Issue ===");
console.log("Problem: Database has 15:00, Google Calendar shows 17:00");
console.log("This suggests a +2 hour shift is happening somewhere");

// Test the exact scenario
const testExam = {
  id: 1,
  subject: "Test Subject",
  code: "TEST123",
  date: "2025-07-25", // Today's date (summer, UTC+2)
  time: "15:00", // 3 PM - should stay 3 PM in Madrid
  duration_minutes: 120,
  location: "Test Location",
  school: "ETSINF",
  degree: "Test Degree",
  year: "2024",
  semester: "1"
};

console.log("\n=== Input Data ===");
console.log("Exam date:", testExam.date);
console.log("Exam time:", testExam.time);
console.log("Expected: Should show 15:00 (3 PM) in Madrid timezone");

// Simulate parseExamDateTime function
function simulateParseExamDateTime(dateStr, timeStr, timeZone) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  
  console.log("\n=== parseExamDateTime Simulation ===");
  console.log(`Input: ${dateStr} ${timeStr} (${timeZone})`);
  console.log(`Parsed: year=${year}, month=${month}, day=${day}, hours=${hours}, minutes=${minutes}`);
  
  let examDate;
  if (timeZone === "Europe/Madrid") {
    // Current implementation
    examDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
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

// Test the parsing
const parseResult = simulateParseExamDateTime(testExam.date, testExam.time, "Europe/Madrid");

// Simulate Google Calendar URL generation
console.log("\n=== Google Calendar URL Generation ===");
const startTime = parseResult.start;
const endTime = new Date(startTime);
endTime.setMinutes(startTime.getMinutes() + testExam.duration_minutes);

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

// Check if this matches the 17:00 issue
const madridHour = parseInt(googleStartTime.toLocaleString('en-US', {
  timeZone: 'Europe/Madrid',
  hour: '2-digit',
  hour12: false
}));

console.log("\n=== Analysis ===");
console.log(`Google Calendar will show: ${madridHour}:00`);
console.log(`Expected: 15:00`);
console.log(`Actual problem: ${madridHour === 17 ? '✅ Confirmed - shows 17:00' : '❌ Different issue'}`);

if (madridHour === 17) {
  console.log("\n🔍 ROOT CAUSE FOUND:");
  console.log("The Date object is being created in local time (Madrid)");
  console.log("Then .toISOString() converts it to UTC by subtracting Madrid offset");
  console.log("Then Google Calendar treats the UTC time as if it's the event time");
  console.log("Then Google Calendar converts back to Madrid time by adding the offset");
  console.log("Result: 15:00 Madrid → 13:00 UTC → Google treats as 13:00 UTC → 15:00 Madrid");
  console.log("Wait, that should work... Let me check the actual conversion...");
  
  console.log("\n🔍 DETAILED ANALYSIS:");
  console.log("1. Database: 15:00 (Madrid time)");
  console.log("2. new Date(2025, 6, 25, 15, 0, 0, 0) creates:", startTime.toString());
  console.log("3. .toISOString() gives:", startTime.toISOString());
  console.log("4. Google Calendar format:", startFormatted);
  console.log("5. Google interprets this UTC time and shows in Madrid:", 
    googleStartTime.toLocaleString('en-US', {timeZone: 'Europe/Madrid'}));
}

// Test what happens if we create the date as UTC
console.log("\n=== Testing UTC Creation ===");
const utcDate = new Date(Date.UTC(2025, 6, 25, 15, 0, 0, 0));
console.log("UTC Date created:", utcDate.toISOString());
console.log("UTC Date in Madrid:", utcDate.toLocaleString('en-US', {timeZone: 'Europe/Madrid'}));