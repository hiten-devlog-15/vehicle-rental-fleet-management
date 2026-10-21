// seed/setupAdmin.js — Secure Admin Account Setup Script
//
// Configures the designated Admin account in MongoDB Atlas:
//   Email: process.env.ADMIN_EMAIL || '2024.hiten.nath@ves.ac.in'
//   Role:  'admin'
//
// Security & Idempotency:
//   - Password read securely from process.env.ADMIN_PASSWORD or process.argv[2]
//   - Hashed using bcryptjs (12 salt rounds) via Mongoose pre('save') hook in User model
//   - Plaintext passwords and hashes are NEVER printed to stdout/stderr
//   - Idempotent: updates existing account without creating duplicate documents

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');

async function setupAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || process.argv[2] || '2024.hiten.nath@ves.ac.in').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || process.argv[3];

  if (!adminPassword) {
    console.error('❌ Error: ADMIN_PASSWORD environment variable or argument is required.');
    console.error('Set ADMIN_PASSWORD in backend/.env or run: node seed/setupAdmin.js <email> <password>');
    process.exit(1);
  }

  if (adminPassword.length < 8) {
    console.error('❌ Error: Admin password must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    await connectDB();

    let user = await User.findOne({ email: adminEmail });

    if (user) {
      user.role = 'admin';
      user.password = adminPassword; // Pre-save hook hashes with bcryptjs
      if (!user.name) user.name = 'Hiten Nath';
      await user.save();
      console.log(`✅ Admin account updated successfully for: ${adminEmail} (Role: ${user.role})`);
    } else {
      user = new User({
        name: 'Hiten Nath',
        email: adminEmail,
        password: adminPassword, // Pre-save hook hashes with bcryptjs
        role: 'admin',
        phone: '+91 98765 00000',
      });
      await user.save();
      console.log(`✅ Admin account created successfully for: ${adminEmail} (Role: ${user.role})`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to configure Admin account:', error.message);
    process.exit(1);
  }
}

setupAdmin();
