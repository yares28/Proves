// Simple test to verify UPV-compatible iCal format
const { generateICalContent } = require('./lib/utils');

// Mock exam data
const mockExams = [
  {
    id: '1',
    subject: 'Estructura de computadores',
    code: 'ETC001',
    date: '2025-01-09',
    time: '08:00',
    duration_minutes: 150,
    location: 'AULA 1G 0.1 (ETSINF), AULA 1G 0.2 (ETSINF)',
    school: 'ETSINF',
    degree: 'Computer Science',
    year: '3',
    semester: '1',
    acronym: 'EC'
  },
  {
    id: '2',
    subject: 'Sistemas inteligentes',
    code: 'SI001',
    date: '2025-01-08',
    time: '15:00',
    duration_minutes: 150,
    location: 'AULA 1G 0.1 (ETSINF), AULA 1G 0.2 (ETSINF)',
    school: 'ETSINF',
    degree: 'Computer Science',
    year: '3',
    semester: '1',
    acronym: 'SI'
  }
];

console.log('🧪 Testing UPV-compatible iCal format...\n');

try {
  // Test UPV format
  const upvContent = generateICalContent(mockExams, {
    calendarName: 'UPV Exams - Test Student',
    useUPVFormat: true
  });

  console.log('✅ UPV Format Generated Successfully!');
  console.log('📄 Content Length:', upvContent.length, 'bytes');
  console.log('📋 Content Preview:\n');
  console.log(upvContent.substring(0, 800));
  console.log('\n...\n');

  // Validate UPV format characteristics
  const validations = [
    {
      name: 'Has UPV PRODID',
      test: upvContent.includes('PRODID:-//UPV-Cal//Exam API 1.0//ES'),
      expected: true
    },
    {
      name: 'Has Apple Calendar Color',
      test: upvContent.includes('X-APPLE-CALENDAR-COLOR:#0252D4'),
      expected: true
    },
    {
      name: 'Uses UTC timestamps (Z suffix)',
      test: upvContent.includes('DTSTART:') && upvContent.includes('Z'),
      expected: true
    },
    {
      name: 'Has UPV background colors',
      test: upvContent.includes('UPV_BGCOLOR:'),
      expected: true
    },
    {
      name: 'Has UPV foreground colors',
      test: upvContent.includes('UPV_FGCOLOR:'),
      expected: true
    },
    {
      name: 'No VTIMEZONE block (UTC strategy)',
      test: !upvContent.includes('BEGIN:VTIMEZONE'),
      expected: true
    },
    {
      name: 'Correct event count',
      test: (upvContent.match(/BEGIN:VEVENT/g) || []).length === 2,
      expected: true
    },
    {
      name: 'Has proper line endings (CRLF)',
      test: upvContent.includes('\r\n'),
      expected: true
    }
  ];

  console.log('🔍 Validation Results:');
  let allPassed = true;
  validations.forEach(validation => {
    const passed = validation.test === validation.expected;
    console.log(`${passed ? '✅' : '❌'} ${validation.name}: ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) allPassed = false;
  });

  console.log(`\n${allPassed ? '🎉 All validations passed!' : '⚠️ Some validations failed!'}`);

  // Test empty exam list (should generate placeholder)
  console.log('\n🧪 Testing empty exam list...');
  const emptyContent = generateICalContent([], {
    calendarName: 'Empty Calendar',
    useUPVFormat: true
  });

  const hasPlaceholder = emptyContent.includes('No Exams Found');
  console.log(`${hasPlaceholder ? '✅' : '❌'} Placeholder event: ${hasPlaceholder ? 'PASS' : 'FAIL'}`);

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
}