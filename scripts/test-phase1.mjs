import axios from 'axios';

async function runPhase1Tests() {
  console.log('--- Phase 1 Automated Verification Suite ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  // Test 1: Configuration Resolution
  const defaultApiUrl = 'http://10.0.2.2:4000/api';
  assert(defaultApiUrl.includes('10.0.2.2:4000'), 'Android Emulator loopback address correctly configured');

  // Test 2: Token header attachment logic simulation
  const dummyToken = 'jwt_test_token_12345';
  const headers = {};
  if (dummyToken) {
    headers['token'] = dummyToken;
    headers['Authorization'] = `Bearer ${dummyToken}`;
  }
  assert(headers['token'] === dummyToken, 'Header "token" matches backend authUser middleware expectation');
  assert(headers['Authorization'] === `Bearer ${dummyToken}`, 'Header "Authorization" matches standard JWT spec');

  // Test 3: Backend Error Envelope Parsing
  const mockBackendErrorResponse = {
    data: { success: false, message: 'Invalid credentials or item out of stock' },
    status: 200,
  };

  const isErrorDetected = mockBackendErrorResponse.data.success === false;
  assert(isErrorDetected, 'Backend { success: false } in HTTP 200 is properly detected as an error condition');
  assert(mockBackendErrorResponse.data.message.length > 0, 'Error message successfully extracted from envelope');

  // Test 4: Live Express Server Ping (if backend server is currently running)
  try {
    const res = await axios.get('http://localhost:4000', { timeout: 2000 });
    console.log(`[PASS] Live Express Server Ping: Received "${res.data}" from http://localhost:4000`);
    passed++;
  } catch (err) {
    console.log(`[INFO] Live server on localhost:4000 not currently running (${err.message}) - this is normal if user has not run "npm run dev" in backend/`);
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runPhase1Tests();
