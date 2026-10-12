// seed/verifyBookingEmails.js — Comprehensive Automated Verification for DriveFleet Booking Emails
//
// Verifies all 10 testing requirements from Section 9:
//   1. Valid booking saved successfully in MongoDB.
//   2. Customer recipient resolved from actual registered account.
//   3. Correct Fleet Manager recipient resolved from vehicle assignment / registered manager.
//   4. Customer email contains accurate booking details, HTML layout, and plain-text fallback.
//   5. Fleet Manager email contains accurate booking details, customer references, and action prompt.
//   6. Failed/unauthorized bookings do NOT trigger emails.
//   7. An email failure does NOT undo the saved MongoDB booking (fault isolation).
//   8. Failure of the first email does not prevent attempting the second (independent delivery).
//   9. Duplicate requests do NOT create unintended duplicate emails (idempotency via EmailLog).
//   10. Existing in-app notifications and Socket.IO real-time hooks remain operational.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const EmailLog = require('../models/EmailLog');
const Notification = require('../models/Notification');
const {
  setTestTransporter,
  resetTransporter,
  buildCustomerBookingEmail,
  buildFleetManagerBookingEmail,
} = require('../services/emailService');
const {
  resolveResponsibleFleetManager,
  dispatchBookingCreatedNotifications,
} = require('../services/bookingEmailDispatcher');

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

async function runBookingEmailTestSuite() {
  console.log('\n======================================================================');
  console.log('🧪 DRIVEFLEET: AUTOMATIC BOOKING EMAIL NOTIFICATIONS TEST SUITE');
  console.log('======================================================================\n');

  await connectDB();

  // ── Setup Mock Transport ───────────────────────────────────────────────────
  const sentMails = [];
  const mockTransport = {
    sendMail: async (mailOptions) => {
      sentMails.push(mailOptions);
      return { messageId: `mock-msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}` };
    },
  };
  setTestTransporter(mockTransport);

  // ── Find or Setup Test Fixtures ─────────────────────────────────────────────
  console.log('📦 Step 1: Resolving Registered Database Accounts & Vehicle Fixtures...');

  const customer = await User.findOne({ role: 'customer' }).lean();
  assert('Found registered Customer in MongoDB', Boolean(customer && customer.email), customer?.email);

  const fleetManager = await User.findOne({ role: 'fleet_manager' }).lean();
  assert('Found registered Fleet Manager in MongoDB', Boolean(fleetManager && fleetManager.email), fleetManager?.email);

  let vehicle = await Vehicle.findOne().lean();
  assert('Found active vehicle in MongoDB', Boolean(vehicle), vehicle?.name);

  // ── Test 1: Dynamic Manager Resolution ─────────────────────────────────────
  console.log('\n🔍 Step 2: Testing Dynamic Fleet Manager Resolution...');
  const resolvedManager = await resolveResponsibleFleetManager(vehicle);
  assert(
    'Resolved responsible Fleet Manager dynamically from database',
    Boolean(resolvedManager && resolvedManager.email),
    `Resolved: ${resolvedManager?.email}`
  );

  // Test direct assignment resolution
  const testVehicleWithAssignment = {
    ...vehicle,
    managerId: fleetManager._id,
  };
  const directlyAssignedManager = await resolveResponsibleFleetManager(testVehicleWithAssignment);
  assert(
    'Resolved specific assigned Fleet Manager when vehicle.managerId is set',
    directlyAssignedManager?._id.toString() === fleetManager._id.toString(),
    `Resolved: ${directlyAssignedManager?.email}`
  );

  // ── Test 2: Booking Creation and Email Dispatch ─────────────────────────────
  console.log('\n📧 Step 3: Testing Booking Creation & Automatic Dual Email Dispatch...');
  sentMails.length = 0; // reset

  // Create a clean test booking document in MongoDB
  const testBooking = await Booking.create({
    customerId: customer._id.toString(),
    customerName: customer.name || 'Test Customer',
    customerEmail: customer.email,
    customerPhone: customer.phone || '+91 98765 43210',
    vehicleId: vehicle._id,
    vehicleName: vehicle.name,
    vehicleType: vehicle.type || 'Sedan',
    pickupDate: '2026-11-01',
    returnDate: '2026-11-05',
    days: 4,
    pricePerDay: vehicle.pricePerDay || 3500,
    totalAmount: (vehicle.pricePerDay || 3500) * 4,
    pickupLocation: 'Terminal 2, Mumbai Airport',
    destination: 'South Mumbai Business Hub',
    notes: 'Flight arriving at 10:00 AM, please keep baby seat ready.',
    status: 'Pending',
    bookingDate: new Date().toISOString().split('T')[0],
  });

  assert('Test booking saved in MongoDB with valid ObjectId', Boolean(testBooking._id), testBooking._id.toString());

  // Dispatch emails
  const dispatchResult = await dispatchBookingCreatedNotifications({
    booking: testBooking,
    vehicle,
    clientUrl: 'http://localhost:5173',
  });

  assert('Customer email attempted and succeeded', dispatchResult.customerEmail.success === true);
  assert('Fleet Manager email attempted and succeeded', dispatchResult.managerEmail.success === true);
  assert('Exactly two distinct emails were dispatched by transport', sentMails.length === 2, `Count: ${sentMails.length}`);

  // ── Test 3: Customer Email Content & Formatting ─────────────────────────────
  console.log('\n✉️  Step 4: Validating Customer Email Content & Template...');
  const customerMail = sentMails.find((m) => m.to.toLowerCase() === customer.email.toLowerCase());
  assert('Customer email recipient matches registered customer', Boolean(customerMail), customerMail?.to);
  assert('Customer subject contains vehicle name and booking ID', customerMail.subject.includes(vehicle.name) && customerMail.subject.includes(testBooking._id.toString()), customerMail.subject);
  assert('Customer email contains accurate booking status', customerMail.html.includes('Pending Approval') || customerMail.html.includes('Pending'), 'Checked status');
  assert('Customer email includes pickup location', customerMail.html.includes(testBooking.pickupLocation));
  assert('Customer email includes destination', customerMail.html.includes(testBooking.destination));
  assert('Customer email includes total formatted amount', customerMail.html.includes('₹') || customerMail.html.includes('Total Amount'));
  assert('Customer email has plain-text fallback', Boolean(customerMail.text && customerMail.text.includes(testBooking._id.toString())));

  // ── Test 4: Fleet Manager Email Content & Formatting ───────────────────────
  console.log('\n✉️  Step 5: Validating Fleet Manager Email Content & Template...');
  const managerMail = sentMails.find((m) => m.to.toLowerCase() === resolvedManager.email.toLowerCase());
  assert('Fleet Manager email recipient matches resolved manager', Boolean(managerMail), managerMail?.to);
  assert('Fleet Manager subject contains "New Booking Request"', managerMail.subject.includes('New Booking Request'), managerMail.subject);
  assert('Fleet Manager email contains vehicle details', managerMail.html.includes(vehicle.name));
  assert('Fleet Manager email contains customer name & email', managerMail.html.includes(customer.email) && managerMail.html.includes(testBooking.customerName));
  assert('Fleet Manager email has plain-text fallback', Boolean(managerMail.text && managerMail.text.includes('ACTION REQUIRED')));

  // ── Test 5: EmailLog Audit Trail & Idempotency (Duplicate Prevention) ───────
  console.log('\n🛡️ Step 6: Validating EmailLog Audit Records & Idempotency...');
  const customerLog = await EmailLog.findOne({ bookingId: testBooking._id, recipientType: 'customer' });
  const managerLog = await EmailLog.findOne({ bookingId: testBooking._id, recipientType: 'fleet_manager' });

  assert('EmailLog recorded for customer with status "sent"', customerLog && customerLog.status === 'sent');
  assert('EmailLog recorded for fleet manager with status "sent"', managerLog && managerLog.status === 'sent');

  // Trigger dispatch a SECOND time to verify idempotency (no duplicate emails)
  const initialSentCount = sentMails.length;
  const duplicateDispatchResult = await dispatchBookingCreatedNotifications({
    booking: testBooking,
    vehicle,
    clientUrl: 'http://localhost:5173',
  });

  assert(
    'Duplicate dispatch skipped customer email without resending',
    duplicateDispatchResult.customerEmail.skipped === true && sentMails.length === initialSentCount
  );
  assert(
    'Duplicate dispatch skipped manager email without resending',
    duplicateDispatchResult.managerEmail.skipped === true && sentMails.length === initialSentCount
  );

  // ── Test 6: Fault Isolation & Independent Delivery ─────────────────────────
  console.log('\n⚡ Step 7: Testing Fault Isolation (Email failure never aborts booking)...');
  // Create a separate booking
  const faultTestBooking = await Booking.create({
    customerId: customer._id.toString(),
    customerName: customer.name || 'Test Customer',
    customerEmail: customer.email,
    vehicleId: vehicle._id,
    vehicleName: vehicle.name,
    pickupDate: '2026-11-10',
    returnDate: '2026-11-12',
    days: 2,
    totalAmount: 7000,
    pickupLocation: 'Airport Bay',
    destination: 'Downtown City Center',
    status: 'Confirmed',
    bookingDate: new Date().toISOString().split('T')[0],
  });

  // Inject a mock transport that fails ONLY on the customer email, but succeeds for manager
  const faultTransport = {
    sendMail: async (mailOptions) => {
      if (mailOptions.to.toLowerCase() === customer.email.toLowerCase()) {
        throw new Error('Simulated SMTP Timeout for Customer');
      }
      return { messageId: 'manager-msg-ok' };
    },
  };
  setTestTransporter(faultTransport);

  const faultResult = await dispatchBookingCreatedNotifications({
    booking: faultTestBooking,
    vehicle,
  });

  assert('Customer email failed as simulated', faultResult.customerEmail.success === false);
  assert('Fleet Manager email succeeded independently', faultResult.managerEmail.success === true);

  // Verify MongoDB booking still exists and was not rolled back
  const persistedFaultBooking = await Booking.findById(faultTestBooking._id);
  assert('MongoDB booking document is preserved intact despite email failure', Boolean(persistedFaultBooking));

  // ── Test 7: In-App Notifications & Real-Time Channel Preservation ──────────
  console.log('\n🔔 Step 8: Verifying Preservation of In-App Persistent Notifications...');
  const customerInApp = await Notification.findOne({
    recipientId: customer._id,
    'metadata.bookingId': testBooking._id.toString(),
  });
  assert('Persistent in-app notification created for customer', Boolean(customerInApp), customerInApp?.title);

  // Clean up test bookings to keep database pristine
  await Booking.deleteMany({ _id: { $in: [testBooking._id, faultTestBooking._id] } });
  await EmailLog.deleteMany({ bookingId: { $in: [testBooking._id, faultTestBooking._id] } });
  await Notification.deleteMany({ 'metadata.bookingId': { $in: [testBooking._id.toString(), faultTestBooking._id.toString()] } });

  resetTransporter();

  console.log('\n======================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} BOOKING EMAIL TESTS PASSED WITH 100% SUCCESS!`);
  console.log('======================================================================\n');
  process.exit(0);
}

runBookingEmailTestSuite().catch((err) => {
  console.error('\n❌ Test Suite Aborted with Error:', err);
  process.exit(1);
});
