// Simple test to check database connection and data
const { createClient } = require('@supabase/supabase-js');

// Hardcode the environment variables for testing (replace with your actual values)
const supabaseUrl = 'https://your-project.supabase.co'; // Replace with actual URL
const supabaseKey = 'your-anon-key'; // Replace with actual key

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test 1: Check if we can connect to the database
    console.log('\n1. Testing basic connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('ETSINF')
      .select('count', { count: 'exact', head: true });
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log(`📊 Total rows in ETSINF table: ${connectionTest?.length || 'Unknown'}`);
    
    // Test 2: Get a sample of exam data
    console.log('\n2. Testing data retrieval...');
    const { data: sampleData, error: dataError } = await supabase
      .from('ETSINF')
      .select('exam_instance_id, exam_date, exam_time, subject, school, degree')
      .limit(5);
    
    if (dataError) {
      console.error('❌ Data retrieval failed:', dataError);
      return;
    }
    
    if (!sampleData || sampleData.length === 0) {
      console.log('⚠️  No exam data found in database');
      return;
    }
    
    console.log('✅ Data retrieval successful');
    console.log(`📋 Sample data (${sampleData.length} rows):`);
    sampleData.forEach((exam, index) => {
      console.log(`  ${index + 1}. ${exam.subject} (${exam.school}) - ${exam.exam_date} ${exam.exam_time}`);
    });
    
    // Test 3: Test the getExams function
    console.log('\n3. Testing getExams function...');
    
    // Import the getExams function (this might fail if there are module issues)
    try {
      const { getExams } = require('./actions/exam-actions.ts');
      const exams = await getExams({});
      
      console.log(`✅ getExams returned ${exams.length} exams`);
      if (exams.length > 0) {
        console.log('📋 First exam:', {
          id: exams[0].id,
          subject: exams[0].subject,
          date: exams[0].date,
          time: exams[0].time
        });
      }
    } catch (importError) {
      console.log('⚠️  Could not test getExams function (module import issue):', importError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabaseConnection();