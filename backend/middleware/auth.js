// middleware/auth.js — JWT Authentication & Authorization Middleware (Experiment 6)
//
// 1. protect: Verifies the JWT sent in the Authorization header (Bearer <token>)
//    - Extracts user ID and role from payload
//    - Reloads the user from MongoDB to ensure the account still exists
//    - Attaches decoded user info to req.user for downstream handlers
//    - Rejects missing, malformed, or expired tokens with 401
// 2. authorize: Restricts access to specific roles (e.g. authorize('fleet_manager', 'admin'))

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to protect routes that require JWT authentication.
 */
const protect = async (req, res, next) => {
  let token;

  // Read Authorization header (Format: Bearer <token>)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Reject if no token provided
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. No authentication token provided.',
    });
  }

  try {
    // Guard: JWT_SECRET must be configured — the authController startup check should catch this first,
    // but we add a safety net here too to protect against misconfiguration.
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: JWT_SECRET is not set.',
      });
    }

    // Verify token signature and expiration using the same secret used to sign it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optionally load latest user details from database (excluding password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // Attach user object to request
    req.user = {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    // Pass JWT errors to centralized error handler or respond directly
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.',
      });
    }
    next(error);
  }
};

/**
 * Middleware to restrict access based on user role.
 * Example: authorize('fleet_manager', 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this route.`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
