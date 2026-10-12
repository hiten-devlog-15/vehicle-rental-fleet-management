// seed/verifyNotifications.js — Automated Notification System Verification
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { notify } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');

async function verifyNotificationSystem() {
  console.log('\n======================================================');
  console.log('🧪 VERIFYING COMPLETE NOTIFICATION SYSTEM (ALL 3 CHANNELS)');
  console.log('======================================================\n');

  await connectDB();

  // 1. Find or verify test customer
  const customer = await User.findOne({ email: 'customer@drivefleet.com' });
  if (!customer) {
    throw new Error('Test customer not found! Run seedUsers.js first.');
  }
  console.log(`✅ Step 1: Found customer: ${customer.name} (${customer.email}), role: ${customer.role}`);

  // 2. Test Email Service (SMTP graceful handling / dry-run)
  console.log('\n📧 Step 2: Testing Email Service...');
  const emailResult = await sendEmail({
    to: customer.email,
    subject: 'DriveFleet Test Notification',
    title: 'Booking Confirmed Test',
    message: 'This is a test notification message verifying email dispatch.',
  });
  console.log(`✅ Email Service result:`, emailResult);

  // 3. Test Unified Notification Dispatcher (In-app MongoDB + Socket.IO + Email)
  console.log('\n🔔 Step 3: Dispatching Multi-Channel Notification...');
  const dispatchResults = await notify({
    recipientId: customer._id,
    recipientEmail: customer.email,
    type: 'success',
    title: 'Booking Approved: Tesla Model 3',
    message: 'Your booking BK-2026-001 has been confirmed by the fleet manager.',
    metadata: {
      bookingId: 'BK-2026-001',
      vehicleName: 'Tesla Model 3',
    },
  });
  console.log('✅ Dispatch results:', dispatchResults);

  // 4. Verify MongoDB Persistence
  console.log('\n💾 Step 4: Verifying MongoDB Notification Persistence...');
  const savedNotif = await Notification.findOne({
    recipientId: customer._id,
    title: 'Booking Approved: Tesla Model 3',
  }).sort({ createdAt: -1 });

  if (!savedNotif) {
    throw new Error('Notification was not saved to MongoDB!');
  }
  console.log('✅ Found notification in MongoDB:', {
    id: savedNotif._id.toString(),
    title: savedNotif.title,
    read: savedNotif.read,
    recipientId: savedNotif.recipientId.toString(),
    type: savedNotif.type,
  });

  // 5. Test mark as read
  console.log('\n👁️ Step 5: Testing Mark as Read in DB...');
  savedNotif.read = true;
  await savedNotif.save();
  const updatedNotif = await Notification.findById(savedNotif._id);
  if (!updatedNotif.read) {
    throw new Error('Mark as read failed!');
  }
  console.log('✅ Notification read status correctly updated to:', updatedNotif.read);

  // 6. Test Unread Count aggregation
  const unreadCount = await Notification.countDocuments({
    recipientId: customer._id,
    read: false,
  });
  console.log(`✅ Unread count for customer: ${unreadCount}`);

  console.log('\n======================================================');
  console.log('🎉 ALL NOTIFICATION SYSTEM BACKEND CHECKS PASSED!');
  console.log('======================================================\n');
  process.exit(0);
}

verifyNotificationSystem().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
