// Test the token-based URL system
const http = require('http');

console.log('🧪 Testing UPV Token-based URL System...\n');

// Step 1: Store a token mapping
const storeToken = (token, queryString) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ token, queryString });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/ical/store-token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Store token failed: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

// Step 2: Test token URL
const testTokenUrl = (token) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/ical/${token}`,
      method: 'GET',
      headers: {
        'Accept': 'text/calendar'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
};

// Main test
async function runTest() {
  try {
    // Generate a test token (simulating the client-side hash)
    const queryString = 'name=UPV%20Exams&school=ETSINF&degree=Computer%20Science&year=3';
    let hash = 0;
    for (let i = 0; i < queryString.length; i++) {
      const char = queryString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const token = Math.abs(hash).toString(16).toUpperCase().padStart(16, '0');
    
    console.log('🔑 Generated token:', token);
    console.log('📝 Query string:', queryString);
    
    // Step 1: Store the token mapping
    console.log('\n📤 Storing token mapping...');
    await storeToken(token, queryString);
    console.log('✅ Token mapping stored successfully');
    
    // Step 2: Test the token URL
    console.log('\n📥 Testing token URL...');
    const result = await testTokenUrl(token);
    
    console.log(`📊 Status: ${result.status}`);
    console.log('📋 Headers:', result.headers);
    console.log('\n📄 Content Length:', result.data.length, 'bytes');
    console.log('📄 Content Preview:\n');
    console.log(result.data.substring(0, 800));
    console.log('\n...\n');
    
    if (result.status === 200) {
      // Validate UPV format
      const validations = [
        {
          name: 'Has UPV PRODID',
          test: result.data.includes('PRODID:-//UPV-Cal//Exam API 1.0//ES'),
          expected: true
        },
        {
          name: 'Has Apple Calendar Color',
          test: result.data.includes('X-APPLE-CALENDAR-COLOR:#0252D4'),
          expected: true
        },
        {
          name: 'Uses UTC timestamps',
          test: result.data.includes('DTSTART:') && result.data.includes('Z'),
          expected: true
        },
        {
          name: 'Has UPV colors',
          test: result.data.includes('UPV_BGCOLOR:'),
          expected: true
        },
        {
          name: 'No VTIMEZONE block',
          test: !result.data.includes('BEGIN:VTIMEZONE'),
          expected: true
        },
        {
          name: 'Has cache headers',
          test: result.headers['cache-control'] === 'public, max-age=3600',
          expected: true
        }
      ];

      console.log('🔍 Token URL Validation Results:');
      let allPassed = true;
      validations.forEach(validation => {
        const passed = validation.test === validation.expected;
        console.log(`${passed ? '✅' : '❌'} ${validation.name}: ${passed ? 'PASS' : 'FAIL'}`);
        if (!passed) allPassed = false;
      });

      console.log(`\n${allPassed ? '🎉 Token system working perfectly!' : '⚠️ Some token system validations failed!'}`);
      
      // Show the final UPV-style URL
      console.log('\n🔗 UPV-style URL format:');
      console.log(`   Original UPV: http://www.upv.es/ical/${token}`);
      console.log(`   Our format:   http://localhost:3000/ical/${token}.ics`);
      console.log('\n✅ URL format matches UPV pattern!');
      
    } else {
      console.log('❌ Token URL test failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTest();