// routes/authRoutes.js — Express Router for Auth & User Management
//
// Endpoints:
//   POST /api/auth/register  — Register new user with express-validator validation
//   POST /api/auth/login     — Login existing user with password check & JWT creation
//   GET  /api/auth/me        — Get authenticated user profile (JWT protected)
//   GET  /api/auth/users     — Fetch all registered users from MongoDB Atlas

const express = require('express');
const router = express.Router();
const { register, login, getMe, getUsers } = require('../controllers/authController');
const { registerRules } = require('../validators/authValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

// POST /api/auth/register — validate request body, then register user
router.post('/register', registerRules, validate, register);

// POST /api/auth/login — authenticate user and return JWT
router.post('/login', login);

// GET /api/auth/me — verify JWT token and return authenticated user
router.get('/me', protect, getMe);

// GET /api/auth/users — list all registered users
router.get('/users', getUsers);

module.exports = router;
