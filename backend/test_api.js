const http = require('http');

console.log('🧪 Starting Urban Harvest Hub API & Database Integration Tests...\n');

function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name} -> ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await test('GET /api/health returns HTTP 200 and status ok', async () => {
    const res = await makeRequest('/api/health');
    if (res.status !== 200 || res.body.status !== 'ok') {
      throw new Error(`Expected 200 ok, got ${res.status} ${JSON.stringify(res.body)}`);
    }
  });

  // 2. Database Status
  await test('GET /api/db-status returns connection status and table stats', async () => {
    const res = await makeRequest('/api/db-status');
    if (res.status !== 200 || !res.body.connection || res.body.connection.status !== 'CONNECTED') {
      throw new Error(`Expected DB status CONNECTED, got ${JSON.stringify(res.body)}`);
    }
  });

  // 3. Products GET
  await test('GET /products returns list of products', async () => {
    const res = await makeRequest('/products');
    if (res.status !== 200 || !Array.isArray(res.body) || res.body.length === 0) {
      throw new Error(`Expected non-empty products array, got ${JSON.stringify(res.body)}`);
    }
  });

  // 4. Products Input Validation
  await test('POST /products fails with 400 on invalid input', async () => {
    const res = await makeRequest('/products', 'POST', { name: '', price: -10 });
    if (res.status !== 400 || !res.body.error) {
      throw new Error(`Expected 400 error response, got ${res.status} ${JSON.stringify(res.body)}`);
    }
  });

  // 5. Workshops GET
  await test('GET /workshops returns list of workshops', async () => {
    const res = await makeRequest('/workshops');
    if (res.status !== 200 || !Array.isArray(res.body)) {
      throw new Error(`Expected workshops array, got ${res.status}`);
    }
  });

  // 6. Events GET
  await test('GET /events returns list of events', async () => {
    const res = await makeRequest('/events');
    if (res.status !== 200 || !Array.isArray(res.body)) {
      throw new Error(`Expected events array, got ${res.status}`);
    }
  });

  console.log(`\n===================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`===================================\n`);
}

runTests().catch(err => console.error('Test suite error:', err));
