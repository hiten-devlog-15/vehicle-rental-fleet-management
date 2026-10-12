// seed/verifyDestinationFlow.js — Verification Script for Destination Field in Booking Flow
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const { formatBookingPayload } = require('../socket');
const {
  buildCustomerBookingEmail,
  buildFleetManagerBookingEmail,
} = require('../services/emailService');

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

async function runDestinationFlowVerification() {
  console.log('\n======================================================================');
  console.log('🧪 DRIVEFLEET: DESTINATION FIELD IN COMPLETE BOOKING FLOW');
  console.log('======================================================================\n');

  await connectDB();

  const customer = await User.findOne({ role: 'customer' }).lean();
  const manager = await User.findOne({ role: 'fleet_manager' }).lean();
  const vehicle = await Vehicle.findOne().lean();

  assert('Customer fixture available', Boolean(customer));
  assert('Vehicle fixture available', Boolean(vehicle));

  // ── Test 1: Schema Rejects Missing Destination ─────────────────────────────
  console.log('\n🛑 Step 1: Testing Schema Rejection when Destination is Missing...');
  let validationErrorCaught = false;
  try {
    const invalidBooking = new Booking({
      customerId: customer._id.toString(),
      customerName: customer.name,
      customerEmail: customer.email,
      vehicleId: vehicle._id,
      vehicleName: vehicle.name,
      pickupDate: '2026-11-20',
      returnDate: '2026-11-23',
      days: 3,
      pricePerDay: 3000,
      totalAmount: 9000,
      pickupLocation: 'Mumbai Airport Terminal 2',
      // destination missing intentionally
    });
    await invalidBooking.validate();
  } catch (err) {
    validationErrorCaught = true;
    assert(
      'Mongoose schema rejects booking without destination',
      err.errors && err.errors.destination && err.errors.destination.kind === 'required',
      err.message
    );
  }
  assert('Validation error was thrown for missing destination', validationErrorCaught);

  // ── Test 2: Valid Booking Creation with Destination ────────────────────────
  console.log('\n💾 Step 2: Testing Valid Booking Creation with Pickup & Destination...');
  const pickupLoc = 'Mumbai Airport Terminal 2, Andheri West';
  const destLoc = 'Pune Railway Station, Pune';

  const validBooking = await Booking.create({
    customerId: customer._id.toString(),
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: '+91 98765 11111',
    vehicleId: vehicle._id,
    vehicleName: vehicle.name,
    pickupDate: '2026-11-20',
    returnDate: '2026-11-23',
    days: 3,
    pricePerDay: 3000,
    totalAmount: 9000,
    pickupLocation: pickupLoc,
    destination: destLoc,
    notes: 'Airport arrival at 8:00 AM',
    status: 'Confirmed',
    bookingDate: new Date().toISOString().split('T')[0],
  });

  assert('Booking created successfully in MongoDB', Boolean(validBooking._id));
  assert('Booking contains exact pickupLocation', validBooking.pickupLocation === pickupLoc);
  assert('Booking contains exact destination', validBooking.destination === destLoc);

  // ── Test 3: API Fetch & Verification from MongoDB ──────────────────────────
  console.log('\n📡 Step 3: Verifying Database Retrieval & API Response Representation...');
  const fetched = await Booking.findById(validBooking._id).lean();
  assert('Fetched booking document from MongoDB', Boolean(fetched));
  assert('Retrieved document preserves destination field', fetched.destination === destLoc);
  assert('Retrieved document preserves pickupLocation field', fetched.pickupLocation === pickupLoc);

  // ── Test 4: Socket.IO Payload Formatting ───────────────────────────────────
  console.log('\n⚡ Step 4: Verifying Socket.IO Event Payload Contains Destination...');
  const socketPayload = formatBookingPayload(validBooking);
  assert('Socket payload includes destination', socketPayload.destination === destLoc, socketPayload.destination);
  assert('Socket payload includes pickupLocation', socketPayload.pickupLocation === pickupLoc);

  // ── Test 5: Email Templates Include Saved Destination ──────────────────────
  console.log('\n✉️  Step 5: Verifying Email Templates Render Saved Destination...');
  const customerEmail = buildCustomerBookingEmail({
    booking: validBooking,
    vehicle,
    customer,
  });
  assert('Customer HTML email displays Destination', customerEmail.html.includes(destLoc));
  assert('Customer text email displays Destination', customerEmail.text.includes(destLoc));

  const managerEmail = buildFleetManagerBookingEmail({
    booking: validBooking,
    vehicle,
    manager,
    customer,
  });
  assert('Fleet Manager HTML email displays Destination', managerEmail.html.includes(destLoc));
  assert('Fleet Manager text email displays Destination', managerEmail.text.includes(destLoc));

  // ── Clean up test document ─────────────────────────────────────────────────
  await Booking.findByIdAndDelete(validBooking._id);
  console.log('\n🧹 Cleaned up test booking fixture.');

  console.log('\n======================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} DESTINATION FLOW CHECKS PASSED SUCCESSFULLY!`);
  console.log('======================================================================\n');
  process.exit(0);
}

runDestinationFlowVerification().catch((err) => {
  console.error('\n❌ Destination Verification Failed:', err);
  process.exit(1);
});
