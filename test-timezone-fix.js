// Test the timezone fix
console.log("=== Testing Timezone Fix ===");

// Simulate the parseExamDateTime function logic
function testParseExamDateTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  
  console.log(`\nTesting: ${dateStr} ${timeStr}`);
  console.log(`Parsed: year=${year}, month=${month}, day=${day}, hours=${hours}, minutes=${minutes}`);
  
  // Current approach: Database stores times in UTC+2, subtract 2 hours to get UTC
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  console.log("UTC date created:", utcDate.toISOString());
  
  // Subtract 2 hours to convert from UTC+2 to UTC
  const examDate = new Date(utcDate.getTime() - 2 * 60 * 60 * 1000);
  console.log("After subtracting 2 hours:", examDate.toISOString());
  
  // What Google Calendar will see
  const googleFormat = examDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  console.log("Google Calendar format:", googleFormat);
  
  // What time this represents in Madrid
  console.log("Madrid local time:", examDate.toLocaleString('en-US', {timeZone: 'Europe/Madrid'}));
  
  return examDate;
}

// Test with the problematic case
console.log("Database stores: 15:00 (should be 3 PM Madrid time)");
console.log("Expected result: Should show as 15:00 in Madrid, 13:00 UTC in summer, 14:00 UTC in winter");

testParseExamDateTime("2025-01-15", "15:00"); // Winter
testParseExamDateTime("2025-07-15", "15:00"); // Summer

// Let's also test what happens if we DON'T subtract the 2 hours
console.log("\n=== Testing WITHOUT timezone adjustment ===");
function testWithoutAdjustment(dateStr, timeStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  
  console.log(`\nTesting: ${dateStr} ${timeStr}`);
  
  // Just create the date as local time
  const examDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  console.log("Local date created:", examDate.toISOString());
  console.log("Madrid local time:", examDate.toLocaleString('en-US', {timeZone: 'Europe/Madrid'}));
  
  return examDate;
}

testWithoutAdjustment("2025-01-15", "15:00"); // Winter
testWithoutAdjustment("2025-07-15", "15:00"); // Summer