// Check DST status for current date and test dates
const testDate1 = new Date("2025-01-15"); // Winter
const testDate2 = new Date("2025-07-15"); // Summer

function isDateInDST(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // DST starts last Sunday in March and ends last Sunday in October
  const getLastSundayOfMonth = (year, month) => {
    const lastDay = new Date(year, month + 1, 0);
    const lastSunday = new Date(lastDay);
    lastSunday.setDate(lastDay.getDate() - lastDay.getDay());
    return lastSunday;
  };

  const marchLastSunday = getLastSundayOfMonth(year, 2); // March
  const octoberLastSunday = getLastSundayOfMonth(year, 9); // October

  return (
    (month > 2 && month < 9) || // April to September
    (month === 2 && day >= marchLastSunday.getDate()) || // March after last Sunday
    (month === 9 && day < octoberLastSunday.getDate()) // October before last Sunday
  );
}

console.log("=== DST Status Check ===");
console.log("Current date:", new Date().toISOString());
console.log("Test date 1 (Jan 15, 2025):", testDate1.toISOString());
console.log("Is Jan 15 in DST?", isDateInDST(testDate1));
console.log("Expected Madrid offset for Jan 15:", isDateInDST(testDate1) ? "UTC+2" : "UTC+1");

console.log("\nTest date 2 (Jul 15, 2025):", testDate2.toISOString());
console.log("Is Jul 15 in DST?", isDateInDST(testDate2));
console.log("Expected Madrid offset for Jul 15:", isDateInDST(testDate2) ? "UTC+2" : "UTC+1");

// Check what the system thinks the offset should be
const jan15Madrid = new Date("2025-01-15T15:00:00");
const jul15Madrid = new Date("2025-07-15T15:00:00");

console.log("\n=== System Timezone Behavior ===");
console.log("Jan 15, 15:00 local -> UTC:", jan15Madrid.toISOString());
console.log("Jul 15, 15:00 local -> UTC:", jul15Madrid.toISOString());

// The correct way: explicitly specify Madrid timezone
console.log("\n=== Correct Approach ===");
console.log("If database stores 15:00 as Madrid time, it should be:");
console.log("Jan 15, 15:00 Madrid -> UTC: 2025-01-15T14:00:00.000Z (UTC+1)");
console.log("Jul 15, 15:00 Madrid -> UTC: 2025-07-15T13:00:00.000Z (UTC+2)");