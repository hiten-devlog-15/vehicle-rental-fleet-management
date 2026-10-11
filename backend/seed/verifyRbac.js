// seed/verifyRbac.js — Automated RBAC Verification Suite for DriveFleet
// Tests all 8 verification items requested in Part 5 against backend API.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 5000}/api`;

const testResults = [];

function assert(description, condition, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
    testResults.push({ description, status: 'PASS', details });
  } else {
    console.error(`  ❌ FAIL: ${description} — ${details}`);
    testResults.push({ description, status: 'FAIL', details });
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return { status: response.status, data };
}

async function runVerification() {
  console.log('\n======================================================');
  console.log('       DRIVEFLEET RBAC VERIFICATION TEST SUITE        ');
  console.log('======================================================\n');

  try {
    // ── TEST 1: Login with Customer ───────────────────────────────────────────
    console.log('[1] Testing Customer Login...');
    const custLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'customer@drivefleet.com', password: 'customer123' }),
    });
    assert('Customer login returns HTTP 200', custLogin.status === 200, `Got ${custLogin.status}`);
    assert('Customer role in response is "customer"', custLogin.data?.user?.role === 'customer', `Got ${custLogin.data?.user?.role}`);
    const customerToken = custLogin.data?.token;
    assert('Customer token is returned', !!customerToken);

    // ── TEST 2: Login with Fleet Manager ──────────────────────────────────────
    console.log('\n[2] Testing Fleet Manager Login...');
    const mgrLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'manager@drivefleet.com', password: 'manager123' }),
    });
    assert('Fleet Manager login returns HTTP 200', mgrLogin.status === 200, `Got ${mgrLogin.status}`);
    assert('Fleet Manager role in response is "fleet_manager"', mgrLogin.data?.user?.role === 'fleet_manager', `Got ${mgrLogin.data?.user?.role}`);
    const managerToken = mgrLogin.data?.token;
    assert('Fleet Manager token is returned', !!managerToken);

    // ── TEST 3: Login with Admin ──────────────────────────────────────────────
    console.log('\n[3] Testing Admin Login...');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@drivefleet.com', password: 'admin123' }),
    });
    assert('Admin login returns HTTP 200', adminLogin.status === 200, `Got ${adminLogin.status}`);
    assert('Admin role in response is "admin"', adminLogin.data?.user?.role === 'admin', `Got ${adminLogin.data?.user?.role}`);
    const adminToken = adminLogin.data?.token;
    assert('Admin token is returned', !!adminToken);

    // ── TEST 4: Token Profile Verification (GET /api/auth/me) ──────────────────
    console.log('\n[4] Verifying Profile Restoration via GET /api/auth/me...');
    const custMe = await request('/auth/me', { headers: { Authorization: `Bearer ${customerToken}` } });
    assert('Customer /api/auth/me returns role "customer"', custMe.data?.user?.role === 'customer');

    const mgrMe = await request('/auth/me', { headers: { Authorization: `Bearer ${managerToken}` } });
    assert('Fleet Manager /api/auth/me returns role "fleet_manager"', mgrMe.data?.user?.role === 'fleet_manager');

    const adminMe = await request('/auth/me', { headers: { Authorization: `Bearer ${adminToken}` } });
    assert('Admin /api/auth/me returns role "admin"', adminMe.data?.user?.role === 'admin');

    // ── TEST 5: Restricted User Management API (GET /api/auth/users) ─────────
    console.log('\n[5] Testing User Management Authorization (GET /api/auth/users)...');
    const noAuthUsers = await request('/auth/users');
    assert('Unauthenticated request to /api/auth/users returns 401', noAuthUsers.status === 401, `Got ${noAuthUsers.status}`);

    const custUsers = await request('/auth/users', { headers: { Authorization: `Bearer ${customerToken}` } });
    assert('Customer request to /api/auth/users returns 403 Forbidden', custUsers.status === 403, `Got ${custUsers.status}`);

    const mgrUsers = await request('/auth/users', { headers: { Authorization: `Bearer ${managerToken}` } });
    assert('Fleet Manager request to /api/auth/users returns 403 Forbidden', mgrUsers.status === 403, `Got ${mgrUsers.status}`);

    const adminUsers = await request('/auth/users', { headers: { Authorization: `Bearer ${adminToken}` } });
    assert('Admin request to /api/auth/users returns 200 OK', adminUsers.status === 200, `Got ${adminUsers.status}`);
    assert('Admin receives array of registered users', Array.isArray(adminUsers.data?.data) && adminUsers.data.data.length > 0);

    // ── TEST 6: Vehicle Management Write Restriction ─────────────────────────
    console.log('\n[6] Testing Vehicle Management Authorization...');
    const custCreateVehicle = await request('/vehicles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ name: 'Unauthorized Car', brand: 'Test', registrationNo: 'MH-99-TEST' }),
    });
    assert('Customer cannot create vehicles (returns 403)', custCreateVehicle.status === 403, `Got ${custCreateVehicle.status}`);

    const unauthVehicle = await request('/vehicles', {
      method: 'POST',
      body: JSON.stringify({ name: 'Unauthorized Car' }),
    });
    assert('Unauthenticated user cannot create vehicles (returns 401)', unauthVehicle.status === 401, `Got ${unauthVehicle.status}`);

    // ── TEST 7: Booking Creation Restriction (Fleet Manager blocked) ──────────
    console.log('\n[7] Testing Booking Creation Authorization...');
    const mgrBook = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ vehicleId: '660000000000000000000000' }),
    });
    assert('Fleet Manager is forbidden from booking vehicles (returns 403)', mgrBook.status === 403, `Got ${mgrBook.status}`);

    // ── TEST 8: Public Registration Security Checks ───────────────────────────
    console.log('\n[8] Testing Public Registration Security & Role Assignment...');

    // Attempt 1: Register as admin -> MUST BE REJECTED
    const randomSuffix = Date.now().toString().slice(-5);
    const adminRegAttempt = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Malicious Attacker',
        email: `attacker_${randomSuffix}@drivefleet.com`,
        password: 'password123',
        role: 'admin',
      }),
    });
    assert('Registration with role="admin" returns HTTP 400 Bad Request', adminRegAttempt.status === 400, `Got ${adminRegAttempt.status}`);
    assert('Registration as admin is blocked with clear message', adminRegAttempt.data?.message?.includes('Admin') || adminRegAttempt.data?.errors?.some(e => e.message?.includes('Admin')));

    // Attempt 2: Register as fleet_manager -> ALLOWED and saved as fleet_manager
    const mgrRegEmail = `fleet_${randomSuffix}@drivefleet.com`;
    const mgrReg = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Fleet Officer',
        email: mgrRegEmail,
        password: 'password123',
        role: 'fleet_manager',
      }),
    });
    assert('Registration as fleet_manager returns HTTP 201 Created', mgrReg.status === 201, `Got ${mgrReg.status}`);
    assert('Registered fleet manager user role is "fleet_manager"', mgrReg.data?.user?.role === 'fleet_manager', `Got ${mgrReg.data?.user?.role}`);

    // Verify login with this new fleet manager returns fleet_manager
    const newMgrLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: mgrRegEmail, password: 'password123' }),
    });
    assert('Newly registered fleet manager logs in with role "fleet_manager"', newMgrLogin.data?.user?.role === 'fleet_manager');

    // Attempt 3: Register as customer (default)
    const custRegEmail = `cust_${randomSuffix}@drivefleet.com`;
    const custReg = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Customer',
        email: custRegEmail,
        password: 'password123',
      }),
    });
    assert('Registration without role defaults to HTTP 201 Created', custReg.status === 201, `Got ${custReg.status}`);
    assert('Registered default user role is "customer"', custReg.data?.user?.role === 'customer', `Got ${custReg.data?.user?.role}`);

    // Summary
    console.log('\n======================================================');
    const passed = testResults.filter(t => t.status === 'PASS').length;
    const failed = testResults.filter(t => t.status === 'FAIL').length;
    console.log(`TOTAL TESTS: ${testResults.length} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runVerification();
