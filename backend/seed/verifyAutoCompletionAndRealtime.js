// seed/verifyAutoCompletionAndRealtime.js — Full Verification for Real-Time Dashboards & Automatic Booking Completion
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const {
  isReturnDatePassed,
  completeExpiredBookings,
} = require('../services/autoCompletionService');
const {
  reconcileVehicleAvailability,
  getLocalDateString,
} = require('../services/vehicleAvailabilityService');
const {
  formatBookingPayload,
} = require('../socket');

let passedTests = 0;
let totalTests = 0;

function assert(description, condition, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    console.error(`  ❌ [FAIL] ${description} ${details ? `— ${details}` : ''}`);
    throw new Error(`Assertion failed: ${description}`);
  }
}

async function runVerification() {
  console.log('\n======================================================================');
  console.log('🧪 DRIVEFLEET: REAL-TIME DASHBOARDS & AUTO BOOKING COMPLETION TEST');
  console.log('======================================================================\n');

  await connectDB();

  // Test identifiers to isolate test records
  const TEST_PREFIX = 'TEST_AUTOCOMP_' + Date.now();
  const testCustomer = await User.findOne({ role: 'customer' }).lean() || {
    _id: 'C001',
    name: 'Test Customer',
    email: 'test.customer@drivefleet.test',
  };

  const todayStr = getLocalDateString();
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayStr = getLocalDateString(yesterday);
  const twoDaysAgo = new Date(Date.now() - 172800000);
  const twoDaysAgoStr = getLocalDateString(twoDaysAgo);
  const tomorrow = new Date(Date.now() + 86400000);
  const tomorrowStr = getLocalDateString(tomorrow);
  const futureDate = new Date(Date.now() + 5 * 86400000);
  const futureDateStr = getLocalDateString(futureDate);

  console.log(`📅 Current Reference Date: ${todayStr}`);
  console.log(`   Yesterday: ${yesterdayStr} | Tomorrow: ${tomorrowStr}\n`);

  // Fixtures created in this run
  const createdVehicleIds = [];
  const createdBookingIds = [];

  try {
    // ── Test 1: Date Logic Tests ─────────────────────────────────────────────
    console.log('🔍 Step 1: Testing Expiration Date Evaluation Rules...');
    assert('isReturnDatePassed returns true for yesterday', isReturnDatePassed(yesterdayStr) === true);
    assert('isReturnDatePassed returns false for today (not prematurely completed during return date)', isReturnDatePassed(todayStr) === false);
    assert('isReturnDatePassed returns false for tomorrow', isReturnDatePassed(tomorrowStr) === false);
    assert('isReturnDatePassed returns false for future date', isReturnDatePassed(futureDateStr) === false);

    // ── Step 2: Create Test Vehicle & Test Bookings ──────────────────────────
    console.log('\n🚗 Step 2: Creating Test Vehicles and Reservations...');

    const testVehicle1 = await Vehicle.create({
      name: `${TEST_PREFIX} Sedan`,
      type: 'Sedan',
      brand: 'TestBrand',
      pricePerDay: 2500,
      available: false,
      status: 'Booked',
      registrationNo: 'MH-99-TEST-1',
    });
    createdVehicleIds.push(testVehicle1._id);

    // Booking 1: Future return date (must NOT be completed)
    const futureBooking = await Booking.create({
      customerId: testCustomer._id.toString(),
      customerName: testCustomer.name,
      customerEmail: testCustomer.email,
      vehicleId: testVehicle1._id,
      vehicleName: testVehicle1.name,
      pickupDate: todayStr,
      returnDate: futureDateStr,
      days: 5,
      pricePerDay: 2500,
      totalAmount: 12500,
      pickupLocation: 'Mumbai Airport',
      destination: 'Pune City Center',
      status: 'Confirmed',
    });
    createdBookingIds.push(futureBooking._id);

    // Booking 2: Return date = TODAY (must NOT be completed prematurely)
    const todayBooking = await Booking.create({
      customerId: testCustomer._id.toString(),
      customerName: testCustomer.name,
      customerEmail: testCustomer.email,
      vehicleId: testVehicle1._id,
      vehicleName: testVehicle1.name,
      pickupDate: yesterdayStr,
      returnDate: todayStr,
      days: 1,
      pricePerDay: 2500,
      totalAmount: 2500,
      pickupLocation: 'Mumbai Airport',
      destination: 'Bandra Kurla Complex',
      status: 'Active',
    });
    createdBookingIds.push(todayBooking._id);

    // Booking 3: Return date = YESTERDAY (MUST be completed)
    const testVehicle2 = await Vehicle.create({
      name: `${TEST_PREFIX} SUV`,
      type: 'SUV',
      brand: 'TestBrand',
      pricePerDay: 3500,
      available: false,
      status: 'Booked',
      registrationNo: 'MH-99-TEST-2',
    });
    createdVehicleIds.push(testVehicle2._id);

    const expiredBooking = await Booking.create({
      customerId: testCustomer._id.toString(),
      customerName: testCustomer.name,
      customerEmail: testCustomer.email,
      vehicleId: testVehicle2._id,
      vehicleName: testVehicle2.name,
      pickupDate: twoDaysAgoStr,
      returnDate: yesterdayStr,
      days: 1,
      pricePerDay: 3500,
      totalAmount: 3500,
      pickupLocation: 'Andheri West',
      destination: 'Navi Mumbai',
      status: 'Active',
    });
    createdBookingIds.push(expiredBooking._id);

    // ── Step 3: Run Automatic Completion ────────────────────────────────────
    console.log('\n⚙️ Step 3: Running Automatic Expired Booking Completion...');
    const completions = await completeExpiredBookings();

    const checkedFuture = await Booking.findById(futureBooking._id);
    assert('Future booking was NOT completed (status is Confirmed)', checkedFuture.status === 'Confirmed');

    const checkedToday = await Booking.findById(todayBooking._id);
    assert('Booking returning today was NOT completed prematurely (status is Active)', checkedToday.status === 'Active');

    const checkedExpired = await Booking.findById(expiredBooking._id);
    assert('Expired booking was automatically marked Completed', checkedExpired.status === 'Completed');

    const checkedVehicle2 = await Vehicle.findById(testVehicle2._id);
    assert('Associated vehicle was freed to Available status', checkedVehicle2.status === 'Available');
    assert('Associated vehicle available flag is true', checkedVehicle2.available === true);

    // ── Step 4: Test Vehicle Under Maintenance ──────────────────────────────
    console.log('\n🔧 Step 4: Testing Vehicle Under Maintenance Safety Rule...');
    const maintVehicle = await Vehicle.create({
      name: `${TEST_PREFIX} Maintenance Van`,
      type: 'Van',
      brand: 'TestBrand',
      pricePerDay: 2000,
      available: false,
      status: 'Maintenance',
      registrationNo: 'MH-99-TEST-3',
    });
    createdVehicleIds.push(maintVehicle._id);

    const expiredBookingOnMaint = await Booking.create({
      customerId: testCustomer._id.toString(),
      customerName: testCustomer.name,
      customerEmail: testCustomer.email,
      vehicleId: maintVehicle._id,
      vehicleName: maintVehicle.name,
      pickupDate: twoDaysAgoStr,
      returnDate: yesterdayStr,
      days: 1,
      pricePerDay: 2000,
      totalAmount: 2000,
      pickupLocation: 'Thane',
      destination: 'Kalyan',
      status: 'Confirmed',
    });
    createdBookingIds.push(expiredBookingOnMaint._id);

    await completeExpiredBookings();

    const checkedExpiredMaint = await Booking.findById(expiredBookingOnMaint._id);
    assert('Expired booking on maintenance vehicle was marked Completed', checkedExpiredMaint.status === 'Completed');

    const checkedMaintVehicle = await Vehicle.findById(maintVehicle._id);
    assert('Vehicle under Maintenance remains in Maintenance status', checkedMaintVehicle.status === 'Maintenance');
    assert('Vehicle under Maintenance available flag remains false', checkedMaintVehicle.available === false);

    // ── Step 5: Test Overlapping Booking Safety ──────────────────────────────
    console.log('\n📅 Step 5: Testing Overlapping Active Booking Retention...');
    const sharedVehicle = await Vehicle.create({
      name: `${TEST_PREFIX} Shared EV`,
      type: 'Electric Sedan',
      brand: 'TestBrand',
      pricePerDay: 4000,
      available: false,
      status: 'Booked',
      registrationNo: 'MH-99-TEST-4',
    });
    createdVehicleIds.push(sharedVehicle._id);

    const expiredLeg = await Booking.create({
      customerId: testCustomer._id.toString(),
      customerName: testCustomer.name,
      customerEmail: testCustomer.email,
      vehicleId: sharedVehicle._id,
      vehicleName: sharedVehicle.name,
      pickupDate: twoDaysAgoStr,
      returnDate: yesterdayStr,
      days: 1,
      pricePerDay: 4000,
      totalAmount: 4000,
      pickupLocation: 'Dadar',
      destination: 'Worli',
      status: 'Active',
    });
    createdBookingIds.push(expiredLeg._id);

    const activeLeg = await Booking.create({
      customerId: testCustomer._id.toString(),
      customerName: testCustomer.name,
      customerEmail: testCustomer.email,
      vehicleId: sharedVehicle._id,
      vehicleName: sharedVehicle.name,
      pickupDate: todayStr,
      returnDate: futureDateStr,
      days: 3,
      pricePerDay: 4000,
      totalAmount: 12000,
      pickupLocation: 'Worli',
      destination: 'Pune',
      status: 'Active',
    });
    createdBookingIds.push(activeLeg._id);

    await completeExpiredBookings();

    const checkedExpiredLeg = await Booking.findById(expiredLeg._id);
    assert('Expired leg was completed', checkedExpiredLeg.status === 'Completed');

    const checkedSharedVehicle = await Vehicle.findById(sharedVehicle._id);
    assert('Vehicle remains Booked because another active booking is ongoing', checkedSharedVehicle.status === 'Booked');
    assert('Vehicle available remains false', checkedSharedVehicle.available === false);

    // ── Step 6: Ineligible Booking Exclusion ─────────────────────────────────
    console.log('\n🚫 Step 6: Testing That Cancelled and Ineligible Bookings are Skipped...');
    const cancelledBooking = await Booking.create({
      customerId: testCustomer._id.toString(),
      customerName: testCustomer.name,
      customerEmail: testCustomer.email,
      vehicleId: testVehicle1._id,
      vehicleName: testVehicle1.name,
      pickupDate: twoDaysAgoStr,
      returnDate: yesterdayStr,
      days: 1,
      pricePerDay: 2500,
      totalAmount: 2500,
      pickupLocation: 'Mumbai',
      destination: 'Nashik',
      status: 'Cancelled',
    });
    createdBookingIds.push(cancelledBooking._id);

    await completeExpiredBookings();
    const checkedCancelled = await Booking.findById(cancelledBooking._id);
    assert('Cancelled booking was NOT modified to Completed', checkedCancelled.status === 'Cancelled');

    // ── Step 7: Idempotency Check ───────────────────────────────────────────
    console.log('\n🔁 Step 7: Testing Idempotency (Running Scheduler Multiple Times)...');
    const repeatRun1 = await completeExpiredBookings();
    const repeatRun2 = await completeExpiredBookings();
    assert('Subsequent run 1 processes 0 duplicate bookings', repeatRun1.length === 0);
    assert('Subsequent run 2 processes 0 duplicate bookings', repeatRun2.length === 0);

    // ── Step 8: Payload Verification for Socket.IO Events ───────────────────
    console.log('\n⚡ Step 8: Verifying Socket.IO Event Payload Formats...');
    const payload = formatBookingPayload(checkedExpired);
    assert('Payload has booking ID', Boolean(payload.id || payload._id));
    assert('Payload has customerName', payload.customerName === testCustomer.name);
    assert('Payload has vehicleName', payload.vehicleName === testVehicle2.name);
    assert('Payload has pickupLocation', payload.pickupLocation === 'Andheri West');
    assert('Payload has destination', payload.destination === 'Navi Mumbai');
    assert('Payload has status Completed', payload.status === 'Completed');
    assert('Payload has returnDate', payload.returnDate === yesterdayStr);

  } finally {
    // ── Step 9: Cleanup ─────────────────────────────────────────────────────
    console.log('\n🧹 Step 9: Cleaning Up Test Fixtures...');
    if (createdBookingIds.length > 0) {
      await Booking.deleteMany({ _id: { $in: createdBookingIds } });
    }
    if (createdVehicleIds.length > 0) {
      await Vehicle.deleteMany({ _id: { $in: createdVehicleIds } });
    }
    console.log(`   Removed ${createdBookingIds.length} test bookings and ${createdVehicleIds.length} test vehicles.`);
  }

  console.log('\n======================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} CHECKS PASSED SUCCESSFULLY!`);
  console.log('======================================================================\n');
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('❌ Verification script failed:', err);
  process.exit(1);
});
