// seed/seedUsers.js — Development-Only Test Account Seed Script
//
// Creates or updates 3 designated test accounts in MongoDB Atlas:
//   1. Customer:      customer@drivefleet.com / customer123 (role: customer)
//   2. Fleet Manager: manager@drivefleet.com  / manager123  (role: fleet_manager)
//   3. Admin:         admin@drivefleet.com    / admin123    (role: admin)
//
// Security & Idempotency:
//   - Strictly refuses execution in production (NODE_ENV === 'production')
//   - Uses User model and bcryptjs pre('save') hook (passwords are never saved as plain text)
//   - Idempotent: re-running updates only designated test accounts without creating duplicates
//   - Does NOT touch or modify any real user accounts in the database

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Guard against execution in production
if (process.env.NODE_ENV === 'production') {
  console.error('\n❌ ERROR: seedUsers script cannot be executed in production environment!');
  console.error('This script is strictly for development and testing environments.\n');
  process.exit(1);
}

const connectDB = require('../config/db');
const User = require('../models/User');

// Documented local test credentials — can be overridden via environment variables if desired
const TEST_ACCOUNTS = [
  {
    name: 'Demo Customer',
    email: (process.env.TEST_CUSTOMER_EMAIL || 'customer@drivefleet.com').toLowerCase(),
    password: process.env.TEST_CUSTOMER_PASSWORD || 'customer123',
    role: 'customer',
    phone: '+91 98765 00001',
  },
  {
    name: 'Demo Fleet Manager',
    email: (process.env.TEST_MANAGER_EMAIL || 'manager@drivefleet.com').toLowerCase(),
    password: process.env.TEST_MANAGER_PASSWORD || 'manager123',
    role: 'fleet_manager',
    phone: '+91 98765 00002',
  },
  {
    name: 'Demo Admin',
    email: (process.env.TEST_ADMIN_EMAIL || 'admin@drivefleet.com').toLowerCase(),
    password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
    role: 'admin',
    phone: '+91 98765 00003',
  },
];

async function seedTestUsers() {
  try {
    console.log('\n🚀 Starting DriveFleet Development User Seeding...');
    await connectDB();

    for (const account of TEST_ACCOUNTS) {
      let user = await User.findOne({ email: account.email });

      if (user) {
        // Idempotent update: update test account details without creating duplicates
        user.name = account.name;
        user.role = account.role;
        user.phone = account.phone;
        user.password = account.password; // Mongoose pre('save') hook will hash with bcryptjs
        await user.save();
        console.log(`  🔄 Updated test account: [${account.role.padEnd(13)}] ${account.email}`);
      } else {
        // Create new designated test user
        user = new User({
          name: account.name,
          email: account.email,
          password: account.password, // Mongoose pre('save') hook will hash with bcryptjs
          role: account.role,
          phone: account.phone,
        });
        await user.save();
        console.log(`  ✅ Created test account: [${account.role.padEnd(13)}] ${account.email}`);
      }
    }

    console.log('\n🎉 Test accounts seeded successfully!');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('ROLE           EMAIL                     PASSWORD');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('Customer:      customer@drivefleet.com   customer123');
    console.log('Fleet Manager: manager@drivefleet.com    manager123');
    console.log('Admin:         admin@drivefleet.com      admin123');
    console.log('─────────────────────────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ User seeding failed:', error.message);
    process.exit(1);
  }
}

seedTestUsers();
