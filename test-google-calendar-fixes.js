// Test the Google Calendar URL generation with the fixes
const { generateGoogleCalendarUrl } = require('./lib/utils.ts');

// Mock exam data
const testExam = {
  id: 1,
  subject: "Test Subject",
  code: "TEST123",
  date: "2025-01-15", // Winter date
  time: "15:00", // 3 PM Madrid time
  duration_minutes: 120,
  location: "Test Location",
  school: "ETSINF",
  degree: "Test Degree",
  year: "2024",
  semester: "1"
};

console.log("=== Testing Google Calendar URL Generation ===");
console.log("Input exam time:", testExam.time);
console.log("Input exam date:", testExam.date);

try {
  const url = generateGoogleCalendarUrl(testExam);
  console.log("\nGenerated URL:", url);
  
  // Extract the dates parameter from the URL
  const datesMatch = url.match(/dates=([^&]+)/);
  if (datesMatch) {
    const datesParam = decodeURIComponent(datesMatch[1]);
    console.log("Dates parameter:", datesParam);
    
    const [startDate, endDate] = datesParam.split('/');
    console.log("Start date:", startDate);
    console.log("End date:", endDate);
    
    // Parse the start date to see what time it represents
    const startDateTime = new Date(
      startDate.substring(0, 4) + '-' +
      startDate.substring(4, 6) + '-' +
      startDate.substring(6, 8) + 'T' +
      startDate.substring(9, 11) + ':' +
      startDate.substring(11, 13) + ':' +
      startDate.substring(13, 15) + 'Z'
    );
    
    console.log("Parsed start time (UTC):", startDateTime.toISOString());
    console.log("Parsed start time (Madrid local):", startDateTime.toLocaleString('en-US', {timeZone: 'Europe/Madrid'}));
  }
} catch (error) {
  console.error("Error generating URL:", error.message);
  
  // Let's test the parseExamDateTime function directly
  console.log("\n=== Testing parseExamDateTime directly ===");
  
  // We need to import or recreate the function since it's not exported
  // Let's create a simple test
  const examDate = new Date(testExam.date);
  const [hours, minutes] = testExam.time.split(":").map(Number);
  const startTime = new Date(examDate);
  startTime.setHours(hours, minutes, 0, 0);
  
  console.log("Simple date creation:");
  console.log("Local time:", startTime.toLocaleString());
  console.log("UTC time:", startTime.toISOString());
  console.log("Hours in local:", startTime.getHours());
  console.log("Hours in UTC:", startTime.getUTCHours());
}