// server.js — DriveFleet Express Server (Experiment 4)
// Sets up the Express application, connects to MongoDB, and mounts all API routes.

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const vehicleRoutes = require('./routes/vehicleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

// ── Initialize Express app ────────────────────────────────────────────────────
const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
// Parse incoming JSON request bodies
app.use(express.json());

// Enable CORS so the React frontend (localhost:5173) can call this API
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ── Routes ────────────────────────────────────────────────────────────────────
// Test route — confirms the API is running
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'DriveFleet API is running',
    version: '1.0.0',
    experiment: 'Experiment 4 — REST API with MongoDB + Mongoose',
    endpoints: {
      vehicles: '/api/vehicles',
      bookings: '/api/bookings',
    },
  });
});

// Vehicle API routes
app.use('/api/vehicles', vehicleRoutes);

// Booking API routes
app.use('/api/bookings', bookingRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
// Catches any request to an unknown route
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// Catches any unexpected errors that were not handled in controllers
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    message: 'Internal server error',
    // Only show error details in development mode
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 DriveFleet server running on port ${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/vehicles`);
  console.log(`   API: http://localhost:${PORT}/api/bookings\n`);
});
