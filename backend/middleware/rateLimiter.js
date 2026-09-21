// middleware/rateLimiter.js — Experiment 5: Rate Limiting
//
// Rate limiting prevents clients from sending too many requests in a short period.
// This protects the API from:
//   • Accidental infinite loops in client code
//   • Abusive or malicious clients hammering the server
//   • Denial-of-service (DoS) attempts
//
// We use the 'express-rate-limit' package.
//
// Two limiters:
//   1. apiLimiter   — applied to ALL /api/* routes (generous limit for browsing)
//   2. writeLimiter — applied to POST/PUT/PATCH/DELETE (stricter, prevents abuse of mutations)
//
// Limits are relaxed enough for normal college testing (you won't hit them during demos).
// When the limit is exceeded, Express automatically returns HTTP 429 Too Many Requests.

const rateLimit = require('express-rate-limit');

// ── General API limiter ──────────────────────────────────────────────────────
// Allows 100 requests per 15 minutes per IP address
// Applied to: GET + all other requests on /api/*
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 100,                  // maximum 100 requests per window per IP
  standardHeaders: true,     // sends RateLimit-* headers in the response (RFC 6585)
  legacyHeaders: false,      // disables the old X-RateLimit-* headers

  // Custom response when limit is exceeded
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again after 15 minutes.',
    });
  },
});

// ── Write operation limiter ──────────────────────────────────────────────────
// More restrictive — applied to POST, PUT, PATCH, DELETE routes
// Allows 30 write requests per 15 minutes per IP
// Prevents someone from spamming "create vehicle" or "create booking"
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,                   // max 30 write operations per window per IP
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many write requests. Please slow down and try again later.',
    });
  },
});

module.exports = { apiLimiter, writeLimiter };
