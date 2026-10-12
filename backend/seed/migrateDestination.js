const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');
const Booking = require('../models/Booking');

async function migrate() {
  await connectDB();
  const bookings = await Booking.find({
    $or: [
      { destination: { $exists: false } },
      { destination: '' },
      { destination: null },
    ],
  });

  for (const b of bookings) {
    b.destination = b.pickupLocation ? `${b.pickupLocation} Drop-off` : 'Pune Railway Station, Pune';
    await b.save({ validateBeforeSave: false });
  }

  console.log(`Successfully migrated ${bookings.length} legacy bookings with destinations.`);
  const all = await Booking.find().select('_id customerName pickupLocation destination').lean();
  console.table(all);
  process.exit(0);
}

migrate();
