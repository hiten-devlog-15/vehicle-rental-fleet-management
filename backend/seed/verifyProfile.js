// backend/seed/verifyProfile.js — Automated Profile & Security Verification Suite
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

async function runProfileVerification() {
  console.log('\n======================================================');
  console.log('    DRIVEFLEET PROFILE & SECURITY VERIFICATION SUITE  ');
  console.log('======================================================\n');

  try {
    // ── 1. CUSTOMER PROFILE & SECURITY TESTS ───────────────────────────────
    console.log('[1] Testing Customer Profile & Security...');
    const custLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'customer@drivefleet.com', password: 'customer123' }),
    });
    assert('Customer login successful (200)', custLogin.status === 200);
    const custToken = custLogin.data?.token;

    // Fetch profile
    const custMe = await request('/auth/me', {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    assert('Customer GET /auth/me returns 200', custMe.status === 200);
    assert('Customer role is "customer"', custMe.data?.user?.role === 'customer');
    assert('Password hash is not exposed in profile', custMe.data?.user?.password === undefined);

    // Update profile
    const custUpdate = await request('/auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({
        name: 'Demo Customer Updated',
        phone: '+91 91234 56789',
        avatar: '🚗',
        role: 'admin', // Attack attempt
      }),
    });
    assert('Customer profile update returns 200', custUpdate.status === 200);
    assert('Name updated correctly', custUpdate.data?.user?.name === 'Demo Customer Updated');
    assert('Phone updated correctly', custUpdate.data?.user?.phone === '+91 91234 56789');
    assert('Avatar updated correctly', custUpdate.data?.user?.avatar === '🚗');
    assert('Role escalation attempt blocked (still "customer")', custUpdate.data?.user?.role === 'customer');

    // Verify persistence via GET /me
    const custMeRefreshed = await request('/auth/me', {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    assert('Persisted name verified', custMeRefreshed.data?.user?.name === 'Demo Customer Updated');
    assert('Persisted role verified as "customer"', custMeRefreshed.data?.user?.role === 'customer');

    // Test password change validation: invalid current password
    const custBadPass = await request('/auth/change-password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({ currentPassword: 'wrongpassword', newPassword: 'newpassword123' }),
    });
    assert('Incorrect current password rejected (400)', custBadPass.status === 400);

    // Test password change validation: short new password
    const custShortPass = await request('/auth/change-password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({ currentPassword: 'customer123', newPassword: '123' }),
    });
    assert('Short new password rejected (400)', custShortPass.status === 400);

    // Valid password change
    const custGoodPass = await request('/auth/change-password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({ currentPassword: 'customer123', newPassword: 'customer123_temp' }),
    });
    assert('Valid password change accepted (200)', custGoodPass.status === 200);

    // Verify login with new password
    const custLoginNew = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'customer@drivefleet.com', password: 'customer123_temp' }),
    });
    assert('Login with new password succeeded (200)', custLoginNew.status === 200);

    // Revert password & personal details
    await request('/auth/change-password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${custLoginNew.data?.token}` },
      body: JSON.stringify({ currentPassword: 'customer123_temp', newPassword: 'customer123' }),
    });
    await request('/auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({ name: 'Demo Customer', phone: '+91 98765 00001', avatar: '' }),
    });
    console.log('  Customer test state reset to default.');

    // ── 2. FLEET MANAGER PROFILE & SECURITY TESTS ──────────────────────────
    console.log('\n[2] Testing Fleet Manager Profile & Security...');
    const mgrLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'manager@drivefleet.com', password: 'manager123' }),
    });
    assert('Fleet Manager login successful (200)', mgrLogin.status === 200);
    const mgrToken = mgrLogin.data?.token;

    // Fetch profile
    const mgrMe = await request('/auth/me', {
      headers: { Authorization: `Bearer ${mgrToken}` },
    });
    assert('Fleet Manager role is "fleet_manager"', mgrMe.data?.user?.role === 'fleet_manager');

    // Update fleet manager profile
    const mgrUpdate = await request('/auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${mgrToken}` },
      body: JSON.stringify({
        name: 'Demo Fleet Manager Updated',
        phone: '+91 98765 43210',
        avatar: '⚡',
        role: 'admin', // Attack attempt
      }),
    });
    assert('Fleet Manager profile update returns 200', mgrUpdate.status === 200);
    assert('Fleet Manager role escalation to admin blocked', mgrUpdate.data?.user?.role === 'fleet_manager');

    // Revert fleet manager details
    await request('/auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${mgrToken}` },
      body: JSON.stringify({ name: 'Demo Fleet Manager', phone: '+91 98765 00002', avatar: '' }),
    });

    // ── 3. ADMIN PROFILE & SECURITY TESTS ──────────────────────────────────
    console.log('\n[3] Testing Admin Profile & Security...');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@drivefleet.com', password: 'admin123' }),
    });
    assert('Admin login successful (200)', adminLogin.status === 200);
    const adminToken = adminLogin.data?.token;

    // Fetch profile
    const adminMe = await request('/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert('Admin role is "admin"', adminMe.data?.user?.role === 'admin');

    // Update admin profile
    const adminUpdate = await request('/auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Demo Admin Updated',
        phone: '+91 99999 11111',
        avatar: '🛡️',
      }),
    });
    assert('Admin profile update returns 200', adminUpdate.status === 200);

    // Revert admin details
    await request('/auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'Demo Admin', phone: '+91 98765 00003', avatar: '' }),
    });

    // Verify Admin users list management preserved
    const adminUsers = await request('/auth/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert('Admin access to /auth/users preserved (200)', adminUsers.status === 200);

    // ── 4. UNAUTHENTICATED & FORBIDDEN ACCESS GUARDS ────────────────────────
    console.log('\n[4] Testing Unauthenticated Guards...');
    const noAuthProfile = await request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Hacker' }),
    });
    assert('Unauthenticated PUT /auth/profile returns 401', noAuthProfile.status === 401);

    const noAuthPass = await request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword: 'a', newPassword: 'b' }),
    });
    assert('Unauthenticated PUT /auth/change-password returns 401', noAuthPass.status === 401);

    console.log('\n======================================================');
    const passed = testResults.filter((t) => t.status === 'PASS').length;
    const failed = testResults.filter((t) => t.status === 'FAIL').length;
    console.log(`TOTAL PROFILE TESTS: ${testResults.length} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  }
}

runProfileVerification();
