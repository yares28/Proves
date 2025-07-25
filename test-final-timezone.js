// Final test to verify timezone conversion is working correctly
console.log("=== Final Timezone Test ===");

// Simulate the parseExamDateTime function logic (current implementation)
function testParseExamDateTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  
  console.log(`\nTesting: ${dateStr} ${timeStr}`);
  
  // Current implementation: Create date as local Madrid time
  const examDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  
  console.log("Created date:", examDate.toISOString());
  console.log("Madrid local time:", examDate.toLocaleString('en-US', {timeZone: 'Europe/Madrid'}));
  console.log("UTC time:", examDate.toUTCString());
  
  // What Google Calendar will receive
  const googleFormat = examDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  console.log("Google Calendar format:", googleFormat);
  
  // Parse the Google format back to see what time it represents
  const googleDate = new Date(
    googleFormat.substring(0, 4) + '-' +
    googleFormat.substring(4, 6) + '-' +
    googleFormat.substring(6, 8) + 'T' +
    googleFormat.substring(9, 11) + ':' +
    googleFormat.substring(11, 13) + ':' +
    googleFormat.substring(13, 15) + 'Z'
  );
  
  console.log("Google will show (Madrid time):", googleDate.toLocaleString('en-US', {timeZone: 'Europe/Madrid'}));
  
  return examDate;
}

console.log("Database stores: 15:00 (should appear as 15:00 in Madrid timezone)");
console.log("Expected: Google Calendar should show 15:00 Madrid time");

// Test winter date (UTC+1)
testParseExamDateTime("2025-01-15", "15:00");

// Test summer date (UTC+2) 
testParseExamDateTime("2025-07-15", "15:00");

console.log("\n=== Summary ===");
console.log("✅ If both tests show 'Google will show (Madrid time): 1/15/2025, 3:00:00 PM' and '7/15/2025, 3:00:00 PM'");
console.log("✅ Then the timezone conversion is working correctly!");
console.log("❌ If times are different, there's still an issue.");

// Test the current system timezone
console.log("\n=== System Info ===");
console.log("System timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log("Current time:", new Date().toLocaleString());
console.log("Current UTC offset (minutes):", new Date().getTimezoneOffset());