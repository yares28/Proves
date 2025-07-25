// Debug timezone conversion issue
const testExam = {
  date: "2025-01-15",
  time: "15:00",
  duration_minutes: 120
};

console.log("=== Debugging Timezone Issue ===");
console.log("Database time:", testExam.time);
console.log("System timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);

// Current approach (what we're doing now)
const examDate = new Date(testExam.date);
const [hours, minutes] = testExam.time.split(":").map(Number);
const startTime = new Date(examDate);
startTime.setHours(hours, minutes, 0, 0);

console.log("\n--- Current Approach ---");
console.log("Created Date object:", startTime);
console.log("Local time string:", startTime.toLocaleString());
console.log("ISO string (what goes to Google):", startTime.toISOString());
console.log("Hours in local:", startTime.getHours());
console.log("Hours in UTC:", startTime.getUTCHours());

// What we should do - create the time as Madrid time explicitly
const madridTime = new Date(testExam.date + "T" + testExam.time + ":00+02:00");
console.log("\n--- Madrid Time Approach ---");
console.log("Madrid Date object:", madridTime);
console.log("Local time string:", madridTime.toLocaleString());
console.log("ISO string (what goes to Google):", madridTime.toISOString());
console.log("Hours in local:", madridTime.getHours());
console.log("Hours in UTC:", madridTime.getUTCHours());

// Test with different system timezones
console.log("\n--- Timezone Offset Info ---");
console.log("System timezone offset (minutes):", new Date().getTimezoneOffset());
console.log("Madrid offset in summer (UTC+2):", -120);
console.log("Madrid offset in winter (UTC+1):", -60);