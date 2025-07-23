// Test the API endpoint directly to see what's happening
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function testApiLogic() {
  console.log('🔍 Testing API logic directly...');
  
  try {
    // Create admin client (service role)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('✅ Created admin client with service role');
    
    // Test direct query to ETSINF
    console.log('📊 Testing direct ETSINF query...');
    const { data: directData, error: directError } = await supabase
      .from('ETSINF')
      .select('exam_instance_id, exam_date, exam_time, duration_minutes, code, subject, acronym, degree, year, semester, place, comment, school')
      .order('exam_date', { ascending: true })
      .limit(5);
    
    if (directError) {
      console.error('❌ Direct query error:', directError);
      return;
    }
    
    console.log(`✅ Direct query returned ${directData.length} rows`);
    if (directData.length > 0) {
      console.log('Sample row:', directData[0]);
    }
    
    // Test with empty filters (like the API does)
    console.log('🔍 Testing with empty filters...');
    const filters = {};
    
    let query = supabase
      .from('ETSINF')
      .select('exam_instance_id, exam_date, exam_time, duration_minutes, code, subject, acronym, degree, year, semester, place, comment, school')
      .order('exam_date', { ascending: true });
    
    // Apply filters (empty in this case)
    if (filters.school && filters.school.length > 0) {
      query = query.in('school', filters.school);
    }
    if (filters.degree && filters.degree.length > 0) {
      query = query.in('degree', filters.degree);
    }
    if (filters.year) {
      query = query.eq('year', filters.year);
    }
    if (filters.semester) {
      query = query.eq('semester', filters.semester);
    }
    if (filters.subject) {
      query = query.ilike('subject', `%${filters.subject}%`);
    }
    if (filters.acronym) {
      query = query.ilike('acronym', `%${filters.acronym}%`);
    }
    
    const { data: filteredData, error: filteredError } = await query;
    
    if (filteredError) {
      console.error('❌ Filtered query error:', filteredError);
      return;
    }
    
    console.log(`✅ Filtered query returned ${filteredData.length} rows`);
    
    // Test the mapper function
    console.log('🔄 Testing data mapping...');
    const mapExamData = (exam) => {
      return {
        id: exam.exam_instance_id,
        date: exam.exam_date,
        time: exam.exam_time,
        duration_minutes: exam.duration_minutes || 120,
        subject: exam.subject,
        code: exam.code?.toString() || '',
        location: exam.place || '',
        year: exam.year?.toString() || '',
        semester: exam.semester || '',
        school: exam.school || '',
        degree: exam.degree || '',
        acronym: exam.acronym || '',
      };
    };
    
    const mappedData = filteredData.map(mapExamData);
    console.log(`✅ Mapped ${mappedData.length} exams`);
    
    if (mappedData.length > 0) {
      console.log('Sample mapped exam:', mappedData[0]);
      
      // Test date parsing
      const exam = mappedData[0];
      console.log('🔍 Testing date parsing...');
      console.log(`  Original date: ${exam.date}`);
      console.log(`  Original time: ${exam.time}`);
      
      // Test the parseExamDateTime logic
      const dateStr = exam.date;
      const timeStr = exam.time;
      
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const timeRegex = /^\d{1,2}:\d{2}/;
      
      console.log(`  Date format valid: ${dateRegex.test(dateStr)}`);
      console.log(`  Time format valid: ${timeRegex.test(timeStr)}`);
      
      if (dateRegex.test(dateStr) && timeRegex.test(timeStr)) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        const examDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
        console.log(`  Parsed date: ${examDate}`);
        console.log(`  Is valid: ${!isNaN(examDate.getTime())}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testApiLogic();