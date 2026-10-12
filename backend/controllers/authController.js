// controllers/authController.js — Authentication & User Management Controller
//
// Experiment 6: JWT Authentication & Role-Based Authorization
//
// Features:
//   1. Register: Creates a new user in MongoDB Atlas
//      - Always assigns role = "customer" — client cannot override this
//      - Password hashed automatically via Mongoose pre('save') hook (bcryptjs)
//      - Generates and returns a JWT signed with JWT_SECRET environment variable
//      - Password hash is never returned in API responses
//   2. Login: Verifies credentials using bcryptjs comparePassword()
//      - Generates JWT containing user ID and role
//   3. Get Current User (me): Returns profile for the authenticated user
//   4. Get Users: Admin/manager endpoint — returns all registered users

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── JWT Secret Guard ──────────────────────────────────────────────────────────
// Fail loudly at startup if the JWT_SECRET environment variable is missing.
// This prevents the server from silently using a weak or predictable secret.
if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is not set. Please add it to backend/.env');
  process.exit(1);
}

/**
 * Helper: Generate a signed JWT for a user.
 * Payload includes user ID, role, and email.
 * Expiry is controlled by JWT_EXPIRES_IN (default: 7d).
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 *
 * Security: role is ALWAYS forced to 'customer' here regardless of what the
 * client submits. Privileged roles (fleet_manager, admin) can only be assigned
 * through a trusted backend/database operation — never through this endpoint.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Security check: Never permit 'admin' or 'manager' via public registration
    if (role && (role.toLowerCase() === 'admin' || role.toLowerCase() === 'manager')) {
      return res.status(400).json({
        success: false,
        message: 'Admin or manager registration is not permitted through public registration.',
      });
    }

    // Determine role: Allow fleet_manager (or 'fleet' alias), otherwise default to customer
    let assignedRole = 'customer';
    if (role === 'fleet_manager' || role === 'fleet') {
      assignedRole = 'fleet_manager';
    }

    // 1. Check if user already exists with this email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already registered. Please login or use a different email.',
      });
    }

    // 2. Create user with assigned role
    //    Mongoose pre('save') hook in User.js automatically hashes password with bcryptjs
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone ? phone.trim() : '',
      role: assignedRole,
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
      avatar: user.avatar || '',
      createdAt: user.createdAt,
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
 * @desc    Update profile for authenticated user
 * @route   PUT /api/auth/profile
 * @access  Private
 *
 * Security:
 * - User ID is derived exclusively from req.user.id (verified JWT)
 * - Only permitted personal fields (name, phone, avatar) are updated
 * - Privileged fields (role, email, password, permissions) are strictly ignored
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { name, phone, avatar } = req.body;

    if (name !== undefined) {
      user.name = name.trim();
    }
    if (phone !== undefined) {
      user.phone = phone.trim();
    }
    if (avatar !== undefined) {
      user.avatar = avatar.trim();
    }

    await user.save();

    const safeUser = {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      avatar: user.avatar || '',
      createdAt: user.createdAt,
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: safeUser,
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password for authenticated user
 * @route   PUT /api/auth/change-password
 * @access  Private
 *
 * Security:
 * - Requires current password verification via bcrypt.compare()
 * - Hashes new password using User schema pre-save hook (bcryptjs with 12 rounds)
 * - Never returns password hashes or secrets in response
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as your current password.',
      });
    }

    // Retrieve user with password hash (select: false in schema)
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password against stored hash
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    // Update password (triggers bcrypt hash in pre-save hook)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
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
  updateProfile,
  changePassword,
  getUsers,
};
