// controllers/authController.js — Authentication & User Management Controller
//
// Features:
//   1. Register: Creates a new user document in MongoDB Atlas users collection
//      - Enforces email uniqueness check
//      - Password is automatically hashed via Mongoose pre('save') hook in User.js using bcryptjs
//      - Password hash is omitted from API response automatically (select: false + toJSON transform)
//   2. Login: Verifies user credentials using comparePassword() instance method (bcryptjs compare)
//   3. Get Users: Fetches all registered users for administration/dashboard view

const User = require('../models/User');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // 1. Check if user already exists with this email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already registered. Please login or use a different email.',
      });
    }

    // 2. Normalize role (default to 'customer' unless explicitly allowed)
    const userRole = role === 'manager' || role === 'fleet' ? 'customer' : (role || 'customer');

    // 3. Create user — Mongoose pre('save') hook in User.js automatically hashes password with bcryptjs
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone ? phone.trim() : '',
      role: userRole,
    });

    // 4. Return success response (toJSON transform automatically strips password)
    res.status(201).json({
      success: true,
      message: 'Account created successfully! User registered in MongoDB Atlas.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & check password
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // 1. Find user by email and explicitly include password field (since select: false in schema)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 2. Verify password using bcryptjs compare method on User model
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 3. Return user data (password is omitted via toJSON)
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all registered users
 * @route   GET /api/auth/users
 * @access  Public (admin/view)
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getUsers,
};
