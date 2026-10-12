// routes/authRoutes.js — Express Router for Auth & User Management
//
// Experiment 6 additions:
//   GET /api/auth/users is now protected — requires a valid JWT and a manager-level role.
//   Unauthenticated requests → 401; customer-role tokens → 403.
//
// Endpoints:
//   POST /api/auth/register  — Register new user (always creates a 'customer' role)
//   POST /api/auth/login     — Login existing user with password check & JWT creation
//   GET  /api/auth/me        — Get authenticated user profile (JWT protected)
//   GET  /api/auth/users     — Fetch all registered users (manager/admin only)

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getUsers,
} = require('../controllers/authController');
const {
  registerRules,
  updateProfileRules,
  changePasswordRules,
} = require('../validators/authValidators');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');

// POST /api/auth/register — validate request body, then register user (always as 'customer')
router.post('/register', registerRules, validate, register);

// POST /api/auth/login — authenticate user and return JWT
router.post('/login', login);

// GET /api/auth/me — verify JWT token and return authenticated user
router.get('/me', protect, getMe);

// PUT /api/auth/profile — update profile of authenticated user
router.put('/profile', protect, updateProfileRules, validate, updateProfile);

// PUT /api/auth/me — alias for profile update
router.put('/me', protect, updateProfileRules, validate, updateProfile);

// PUT /api/auth/change-password — change password of authenticated user
router.put('/change-password', protect, changePasswordRules, validate, changePassword);

// GET /api/auth/users — list all registered users (admin only)
router.get('/users', protect, authorize('admin'), getUsers);

module.exports = router;
