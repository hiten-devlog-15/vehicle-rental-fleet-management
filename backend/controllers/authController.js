// controllers/authController.js — Authentication & User Management Controller
//
// Features:
//   1. Register: Creates a new user document in MongoDB Atlas users collection
//      - Enforces email uniqueness check
//      - Password is automatically hashed via Mongoose pre('save') hook in User.js using bcryptjs
//      - Generates and returns a JWT token signed with JWT_SECRET
//      - Password hash is omitted from API response automatically
//   2. Login: Verifies user credentials using comparePassword() instance method (bcryptjs compare)
//      - Generates and returns a JWT token containing user ID and role
//   3. Get Current User (me): Returns profile of authenticated user
//   4. Get Users: Fetches all registered users for administration/dashboard view

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Helper: Generate JWT for user
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET || 'drivefleet_super_secret_jwt_key_2026_college_project',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Helper: Map raw role string to standard DriveFleet roles
 */
const mapRole = (role) => {
  if (!role) return 'customer';
  const normalized = role.toString().trim().toLowerCase();
  if (normalized === 'fleet' || normalized === 'fleet_manager') return 'fleet_manager';
  if (normalized === 'admin') return 'admin';
  if (normalized === 'manager') return 'manager';
  return 'customer';
};

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

    // 2. Map role appropriately
    const userRole = mapRole(role);

    // 3. Create user — Mongoose pre('save') hook in User.js automatically hashes password with bcryptjs
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone ? phone.trim() : '',
      role: userRole,
    });

    // 4. Generate JWT token
    const token = generateToken(user);

    const safeUser = {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
    };

    // 5. Return success response (never exposing password)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: safeUser,
      data: safeUser,
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

    // 3. Generate JWT token
    const token = generateToken(user);

    const safeUser = {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
    };

    // 4. Return token and safe user data
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser,
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    const safeUser = {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
    };
    res.status(200).json({
      success: true,
      user: safeUser,
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all registered users
 * @route   GET /api/auth/users
 * @access  Public/Admin
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
  getMe,
  getUsers,
};
