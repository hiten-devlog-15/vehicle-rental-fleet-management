// server.js — DriveFleet Express Server (Experiment 5)
//
// Experiment 5 upgrades over Experiment 4:
//   1. Helmet          — adds secure HTTP response headers automatically
//   2. CORS            — origin controlled via FRONTEND_URL environment variable
//   3. Rate limiting   — apiLimiter applied to all /api/* routes
//   4. Body limit      — express.json limited to 10kb to block oversized payloads
//   5. Health endpoint — GET /api/health for easy server status check
//   6. 404 handler     — returns JSON (not HTML) for unknown API routes
//   7. Error handler   — centralized error middleware (must be last)

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const connectDB = require('./config/db');
const vehicleRoutes = require('./routes/vehicleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// ── Initialize Express app ────────────────────────────────────────────────────
const app = express();

// ── Helmet ───────────────────────────────────────────────────────────────────
// Helmet sets various security-related HTTP headers automatically.
// Examples of headers it sets:
//   X-Content-Type-Options: nosniff        → prevents MIME-type sniffing
//   X-Frame-Options: SAMEORIGIN            → prevents clickjacking
//   Referrer-Policy: no-referrer           → limits referrer info leakage
//   X-XSS-Protection: 0                   → modern browsers use CSP instead
//   Content-Security-Policy               → restricts resources the browser loads
//
// helmet() with no arguments enables all protections with safe defaults.
// This is appropriate for a REST API backend.
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
// CORS (Cross-Origin Resource Sharing) controls which origins can call this API.
//
// Why not use origin: "*"?
//   Allowing all origins would let any website in the world make API calls to
//   this backend on behalf of a logged-in user. This is a security risk.
//
// We read the allowed origin from an environment variable (FRONTEND_URL).
// This keeps the backend flexible (staging vs. production URLs) without hardcoding.
//
// Fallback to localhost:5173 for development convenience.
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: [allowedOrigin, 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

// ── Body parser with size limit ───────────────────────────────────────────────
// Limits incoming request body size to 10kb.
// This prevents clients from sending enormous JSON payloads that could slow
// or crash the server (a basic denial-of-service protection).
app.use(express.json({ limit: '10kb' }));

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ── API Rate Limiter ─────────────────────────────────────────────────────────
// Applies to ALL routes under /api/* (100 requests per 15 minutes per IP).
// More restrictive writeLimiter (30/15min) is applied per-route in vehicleRoutes/bookingRoutes.
app.use('/api', apiLimiter);

// ── Health Check Endpoint ─────────────────────────────────────────────────────
// GET /api/health — used to confirm the server is running.
// Also reports the MongoDB connection state:
//   0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbState = mongoose.connection.readyState;
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';

  res.status(200).json({
    success: true,
    message: 'DriveFleet API is healthy',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// ── Root Info Route ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DriveFleet API is running',
    version: '2.0.0',
    experiment: 'Experiment 5 — Secure, Production-Ready RESTful APIs',
    endpoints: {
      health: '/api/health',
      vehicles: '/api/vehicles',
      bookings: '/api/bookings',
    },
  });
});

// ── Vehicle API routes ────────────────────────────────────────────────────────
app.use('/api/vehicles', vehicleRoutes);

// ── Booking API routes ────────────────────────────────────────────────────────
app.use('/api/bookings', bookingRoutes);

// ── Auth & User Management API routes ─────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
// Catches any request to an unknown API route and returns JSON (not an HTML error page).
// This must come AFTER all valid routes.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// Must be the LAST middleware registered.
// Requires exactly 4 arguments (err, req, res, next) — Express uses this signature
// to recognize it as an error-handling middleware.
// All controllers call next(err) to reach this handler.
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 DriveFleet server running on port ${PORT}`);
  console.log(`   Experiment: 5 — Secure, Production-Ready RESTful APIs`);
  console.log(`   Health:    http://localhost:${PORT}/api/health`);
  console.log(`   Vehicles:  http://localhost:${PORT}/api/vehicles`);
  console.log(`   Bookings:  http://localhost:${PORT}/api/bookings\n`);
});
