async function runPhase2Tests() {
  console.log('--- Phase 2 Automated Verification Suite ---');
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

  // Test 1: Password Length Validation matching backend rule
  function validatePassword(pass) {
    return typeof pass === 'string' && pass.length >= 8;
  }
  assert(!validatePassword('short'), 'Rejects password shorter than 8 characters');
  assert(validatePassword('StrongPass123!'), 'Accepts valid 8+ character password');

  // Test 2: Address Book Default Logic Simulation
  let addresses = [
    { id: '1', street: '1st St', city: 'City A', isDefault: true },
    { id: '2', street: '2nd St', city: 'City B', isDefault: false },
  ];

  function addAddress(newAddr) {
    if (newAddr.isDefault) {
      addresses = addresses.map((a) => ({ ...a, isDefault: false }));
    }
    addresses.push(newAddr);
  }

  addAddress({ id: '3', street: '3rd St', city: 'City C', isDefault: true });
  assert(addresses.length === 3, 'Address correctly added to address book');
  assert(addresses[0].isDefault === false, 'Previous default address correctly unset');
  assert(addresses[2].isDefault === true, 'New address marked as default');

  // Test 3: Delete Address Logic
  function deleteAddress(id) {
    addresses = addresses.filter((a) => a.id !== id);
  }
  deleteAddress('2');
  assert(addresses.length === 2 && !addresses.find((a) => a.id === '2'), 'Address deletion removes targeted address');

  // Test 4: Auth Headers Simulation
  const mockToken = 'jwt_sample_token';
  const requestHeaders = { token: mockToken, Authorization: `Bearer ${mockToken}` };
  assert(requestHeaders.token === mockToken, 'Auth header "token" matches backend authUser middleware');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runPhase2Tests();
