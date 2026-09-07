// seed/seed.js — Seeds the DriveFleet MongoDB database with initial vehicle and booking data
// Run with: npm run seed  (from the backend/ directory)
//
// This script uses the exact vehicle data from src/data/vehicles.js
// so the frontend display remains consistent.

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');

// ── Vehicle seed data (matches src/data/vehicles.js exactly) ─────────────────
const vehicleData = [
  {
    name: 'Honda City',
    type: 'Sedan',
    brand: 'Honda',
    image: 'https://images.unsplash.com/photo-1619767886558-efdc259b8e57?w=800&q=80',
    fuel: 'Petrol',
    transmission: 'Automatic',
    seats: 5,
    mileage: '17.8 kmpl',
    pricePerDay: 2800,
    rating: 4.6,
    reviews: 128,
    available: true,
    status: 'Available',
    registrationNo: 'MH-01-AB-1234',
    color: 'Pearl White',
    year: 2023,
    description:
      'The Honda City is a premium sedan known for its refined driving experience, spacious cabin, and fuel efficiency. Ideal for both city commutes and long highway drives.',
    features: ['Sunroof', 'Cruise Control', 'Rear Camera', 'Push Start', 'Alloy Wheels'],
  },
  {
    name: 'Hyundai Creta',
    type: 'SUV',
    brand: 'Hyundai',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
    fuel: 'Diesel',
    transmission: 'Automatic',
    seats: 5,
    mileage: '21.4 kmpl',
    pricePerDay: 3500,
    rating: 4.7,
    reviews: 214,
    available: true,
    status: 'Available',
    registrationNo: 'MH-02-CD-5678',
    color: 'Typhoon Silver',
    year: 2023,
    description:
      'The Hyundai Creta is a feature-packed compact SUV offering commanding road presence and a luxurious interior. Perfect for families and adventure seekers alike.',
    features: ['Panoramic Sunroof', 'Ventilated Seats', 'ADAS', 'Wireless Charging', 'Bose Audio'],
  },
  {
    name: 'Tata Nexon',
    type: 'Compact SUV',
    brand: 'Tata',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    fuel: 'Petrol',
    transmission: 'Manual',
    seats: 5,
    mileage: '17.0 kmpl',
    pricePerDay: 2500,
    rating: 4.4,
    reviews: 98,
    available: true,
    status: 'Available',
    registrationNo: 'MH-03-EF-9012',
    color: 'Flame Red',
    year: 2024,
    description:
      "The Tata Nexon is India's first 5-star safety rated SUV, combining bold design with peppy performance. Great for daily commuting and weekend getaways.",
    features: ['5-Star Safety', 'iRA Connected Tech', 'JBL Audio', 'Electric Sunroof', 'TPMS'],
  },
  {
    name: 'Maruti Swift',
    type: 'Hatchback',
    brand: 'Maruti Suzuki',
    image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80',
    fuel: 'Petrol',
    transmission: 'Manual',
    seats: 5,
    mileage: '23.2 kmpl',
    pricePerDay: 1500,
    rating: 4.3,
    reviews: 176,
    available: true,
    status: 'Available',
    registrationNo: 'MH-04-GH-3456',
    color: 'Speedy Blue',
    year: 2024,
    description:
      'The Maruti Swift is the most popular hatchback in India, offering zippy performance, great fuel economy, and easy maneuverability in city traffic.',
    features: ['SmartPlay Pro+', 'Rear Parking Sensors', 'Hill Hold Control', 'Lane Alert', 'Auto AC'],
  },
  {
    name: 'Toyota Innova Crysta',
    type: 'MPV',
    brand: 'Toyota',
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
    fuel: 'Diesel',
    transmission: 'Automatic',
    seats: 7,
    mileage: '15.1 kmpl',
    pricePerDay: 4500,
    rating: 4.8,
    reviews: 302,
    available: false,
    status: 'Booked',
    registrationNo: 'MH-05-IJ-7890',
    color: 'Super White',
    year: 2022,
    description:
      'The Toyota Innova Crysta is the most trusted MPV for family trips, corporate travel, and airport transfers. Renowned for its bulletproof reliability and spacious 7-seater cabin.',
    features: ['7-Seater', 'Captain Seats', 'Auto Climate', 'Rear AC Vents', 'Toyota Safety Sense'],
  },
  {
    name: 'Royal Enfield Classic 350',
    type: 'Motorcycle',
    brand: 'Royal Enfield',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80',
    fuel: 'Petrol',
    transmission: 'Manual',
    seats: 2,
    mileage: '35.0 kmpl',
    pricePerDay: 1200,
    rating: 4.5,
    reviews: 89,
    available: false,
    status: 'Maintenance',
    registrationNo: 'MH-06-KL-1357',
    color: 'Halcyon Black',
    year: 2023,
    description:
      'The Royal Enfield Classic 350 is an iconic motorcycle that blends retro styling with modern engineering. Perfect for weekend rides and exploring scenic routes.',
    features: ['Dual-Channel ABS', 'Tripper Navigation', 'USB Charging', 'J-Series Engine', 'Classic Chrome'],
  },
  {
    name: 'Mahindra Thar',
    type: '4x4 SUV',
    brand: 'Mahindra',
    image: 'https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=800&q=80',
    fuel: 'Diesel',
    transmission: 'Automatic',
    seats: 4,
    mileage: '15.2 kmpl',
    pricePerDay: 4000,
    rating: 4.6,
    reviews: 143,
    available: true,
    status: 'Available',
    registrationNo: 'MH-07-MN-2468',
    color: 'Rocky Beige',
    year: 2023,
    description:
      'The Mahindra Thar is the ultimate adventure vehicle, built for off-road exploration. With its 4x4 drivetrain and tough construction, it handles any terrain with ease.',
    features: ['4x4 Drive', 'Convertible Top', 'Waterproof Interior', 'Off-road Tyres', 'Rock Crawl Mode'],
  },
  {
    name: 'Kia Seltos',
    type: 'SUV',
    brand: 'Kia',
    image: 'https://images.unsplash.com/photo-1609520505218-7421df82d9a1?w=800&q=80',
    fuel: 'Petrol',
    transmission: 'Automatic',
    seats: 5,
    mileage: '16.5 kmpl',
    pricePerDay: 3200,
    rating: 4.5,
    reviews: 187,
    available: true,
    status: 'Available',
    registrationNo: 'MH-08-OP-3579',
    color: 'Intense Red',
    year: 2024,
    description:
      'The Kia Seltos is a stylish and feature-rich SUV that offers a premium experience at a competitive price. Comes loaded with a 10.25-inch dual screen setup and Bose audio.',
    features: ['Dual 10.25" Screen', 'Bose Premium Audio', 'Kia Connect', 'Ventilated Seats', 'Smart Key'],
  },
  {
    name: 'Volkswagen Polo',
    type: 'Hatchback',
    brand: 'Volkswagen',
    image: 'https://images.unsplash.com/photo-1562141961-b4d8b15d37ad?w=800&q=80',
    fuel: 'Petrol',
    transmission: 'Automatic',
    seats: 5,
    mileage: '16.4 kmpl',
    pricePerDay: 2200,
    rating: 4.4,
    reviews: 67,
    available: true,
    status: 'Available',
    registrationNo: 'MH-09-QR-4680',
    color: 'Deep Black Pearl',
    year: 2022,
    description:
      'The Volkswagen Polo is a European premium hatchback known for its solid build quality, precise handling, and refined driving dynamics.',
    features: ['Composition Color', 'Climatronic AC', 'Cruise Control', 'Touchscreen', 'ESP'],
  },
  {
    name: 'Tesla Model 3',
    type: 'Electric Sedan',
    brand: 'Tesla',
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80',
    fuel: 'Electric',
    transmission: 'Automatic',
    seats: 5,
    mileage: '566 km range',
    pricePerDay: 6500,
    rating: 4.9,
    reviews: 54,
    available: true,
    status: 'Available',
    registrationNo: 'MH-10-ST-5791',
    color: 'Midnight Silver',
    year: 2024,
    description:
      'The Tesla Model 3 is a revolutionary all-electric sedan offering cutting-edge technology, incredible performance, and zero emissions.',
    features: ['Autopilot', '15.4" Touchscreen', 'OTA Updates', 'Supercharging', 'Premium Audio'],
  },
];

// ── Main seed function ────────────────────────────────────────────────────────
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('\n🌱 Starting DriveFleet database seed...\n');

    // Clear existing data
    await Vehicle.deleteMany({});
    await Booking.deleteMany({});
    console.log('✅ Cleared existing vehicles and bookings');

    // Insert vehicles
    const insertedVehicles = await Vehicle.insertMany(vehicleData);
    console.log(`✅ Inserted ${insertedVehicles.length} vehicles`);

    // Print vehicle IDs for reference
    console.log('\n📋 Seeded Vehicle IDs (use these in booking tests):');
    insertedVehicles.forEach((v) => {
      console.log(`   ${v.name.padEnd(30)} → ${v._id}  [${v.status}]`);
    });

    // Seed sample bookings using actual MongoDB vehicle IDs
    // We use Honda City, Hyundai Creta, and Maruti Swift for sample bookings
    const hondaCity = insertedVehicles.find((v) => v.name === 'Honda City');
    const marutiSwift = insertedVehicles.find((v) => v.name === 'Maruti Swift');
    const mahindraT = insertedVehicles.find((v) => v.name === 'Mahindra Thar');

    const bookingData = [
      {
        customerId: 'C001',
        customerName: 'Arjun Sharma',
        customerEmail: 'arjun.sharma@email.com',
        customerPhone: '+91 98765 43210',
        vehicleId: hondaCity._id,
        vehicleName: 'Honda City',
        vehicleType: 'Sedan',
        pickupDate: '2026-08-18',
        returnDate: '2026-08-20',
        days: 2,
        pricePerDay: 2800,
        totalAmount: 6000,
        pickupLocation: 'Andheri West, Mumbai',
        status: 'Completed',
        bookingDate: '2026-08-17',
        notes: '',
      },
      {
        customerId: 'C001',
        customerName: 'Arjun Sharma',
        customerEmail: 'arjun.sharma@email.com',
        customerPhone: '+91 98765 43210',
        vehicleId: marutiSwift._id,
        vehicleName: 'Maruti Swift',
        vehicleType: 'Hatchback',
        pickupDate: '2026-07-20',
        returnDate: '2026-07-22',
        days: 2,
        pricePerDay: 1500,
        totalAmount: 3400,
        pickupLocation: 'Pune Railway Station',
        status: 'Completed',
        bookingDate: '2026-07-15',
        notes: '',
      },
      {
        customerId: 'C001',
        customerName: 'Arjun Sharma',
        customerEmail: 'arjun.sharma@email.com',
        customerPhone: '+91 98765 43210',
        vehicleId: mahindraT._id,
        vehicleName: 'Mahindra Thar',
        vehicleType: '4x4 SUV',
        pickupDate: '2026-09-10',
        returnDate: '2026-09-13',
        days: 3,
        pricePerDay: 4000,
        totalAmount: 12600,
        pickupLocation: 'Lonavala Service Center',
        status: 'Confirmed',
        bookingDate: '2026-08-17',
        notes: 'Weekend trip. Need roof rack if available.',
      },
    ];

    const insertedBookings = await Booking.insertMany(bookingData);
    console.log(`\n✅ Inserted ${insertedBookings.length} sample bookings`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📌 Next step: Start the server with  npm run dev\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
