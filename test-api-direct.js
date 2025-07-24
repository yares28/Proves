// Direct API test for UPV format
const http = require('http');

console.log('🧪 Testing UPV-compatible iCal API...\n');

// Test the main API endpoint
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/ical?name=UPV%20Exams',
  method: 'GET',
  headers: {
    'Accept': 'text/calendar'
  }
};

const req = http.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode} ${res.statusMessage}`);
  console.log('📋 Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📄 Content Length:', data.length, 'bytes');
    console.log('📄 Content Preview:\n');
    console.log(data.substring(0, 1000));
    console.log('\n...\n');
    
    // Validate UPV format characteristics
    const validations = [
      {
        name: 'Has UPV PRODID',
        test: data.includes('PRODID:-//UPV-Cal//Exam API 1.0//ES'),
        expected: true
      },
      {
        name: 'Has Apple Calendar Color',
        test: data.includes('X-APPLE-CALENDAR-COLOR:#0252D4'),
        expected: true
      },
      {
        name: 'Uses UTC timestamps (Z suffix)',
        test: data.includes('DTSTART:') && data.includes('Z'),
        expected: true
      },
      {
        name: 'Has UPV background colors',
        test: data.includes('UPV_BGCOLOR:'),
        expected: true
      },
      {
        name: 'Has UPV foreground colors',
        test: data.includes('UPV_FGCOLOR:'),
        expected: true
      },
      {
        name: 'No VTIMEZONE block (UTC strategy)',
        test: !data.includes('BEGIN:VTIMEZONE'),
        expected: true
      },
      {
        name: 'Has proper line endings (CRLF)',
        test: data.includes('\r\n'),
        expected: true
      },
      {
        name: 'Valid iCalendar structure',
        test: data.startsWith('BEGIN:VCALENDAR') && data.endsWith('END:VCALENDAR'),
        expected: true
      }
    ];

    console.log('🔍 UPV Format Validation Results:');
    let allPassed = true;
    validations.forEach(validation => {
      const passed = validation.test === validation.expected;
      console.log(`${passed ? '✅' : '❌'} ${validation.name}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) allPassed = false;
    });

    console.log(`\n${allPassed ? '🎉 All UPV format validations passed!' : '⚠️ Some UPV format validations failed!'}`);
    
    // Show comparison with original UPV format
    console.log('\n📋 Format Comparison:');
    console.log('Original UPV format characteristics found:');
    if (data.includes('PRODID:-//UPV-Cal//Exam API 1.0//ES')) console.log('✅ UPV PRODID');
    if (data.includes('X-APPLE-CALENDAR-COLOR:#0252D4')) console.log('✅ Apple Calendar Color');
    if (!data.includes('BEGIN:VTIMEZONE')) console.log('✅ No VTIMEZONE (UTC strategy)');
    if (data.includes('UPV_BGCOLOR:') && data.includes('UPV_FGCOLOR:')) console.log('✅ UPV Custom Colors');
    
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
  console.log('Make sure the development server is running on localhost:3000');
  process.exit(1);
});

req.end();