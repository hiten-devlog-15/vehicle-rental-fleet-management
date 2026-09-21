// models/User.js — DriveFleet User schema (Experiment 5 extension: secure user collection)
//
// Key security features:
//   1. Password is NEVER stored as plain text — bcryptjs pre-save hook hashes it
//   2. comparePassword() method uses bcrypt.compare() for safe password checking
//   3. Email is lowercased and trimmed + unique index to prevent duplicate accounts
//   4. role is server-enforced to "customer" on registration (cannot be overridden by client)
//   5. toJSON() transform omits the password field from all API responses automatically

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Salt rounds ───────────────────────────────────────────────────────────────
// 12 rounds = strong security (industry standard: 10–14).
// Higher = slower to compute, making brute-force attacks harder.
const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    // Full name of the user
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    // Email — must be unique across the users collection
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,  // always stored as lowercase to avoid case-sensitivity issues
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    // Password — stored as a bcrypt hash, NEVER as plain text
    // The pre-save hook below handles hashing automatically
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      // select: false ensures password hash is NOT returned in normal queries
      // Controllers must explicitly use .select('+password') when they need it
      select: false,
    },

    // Optional phone number
    phone: {
      type: String,
      default: '',
      trim: true,
    },

    // Role — server-enforced.
    // On registration, the backend always sets this to "customer".
    // The client cannot send a custom role during registration.
    // "manager" can only be set manually or through an admin operation.
    role: {
      type: String,
      enum: {
        values: ['customer', 'manager'],
        message: 'Role must be customer or manager',
      },
      default: 'customer',
    },
  },
  {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// ── Pre-save hook: Hash password before saving ────────────────────────────────
// This hook runs automatically whenever a User document is saved.
// It only hashes the password if the password field was modified (e.g., on create or password change).
// This prevents re-hashing an already-hashed password when other fields are updated.
//
// How bcrypt works:
//   1. bcrypt.genSalt(12) generates a random salt (a unique random string)
//   2. bcrypt.hash(password, salt) combines the password + salt and hashes it
//   3. The result ($2b$12$...) is stored in the database instead of the plain password
//   4. The salt is embedded in the hash — bcrypt knows how to verify it later
userSchema.pre('save', async function (next) {
  // 'this' refers to the current User document being saved
  if (!this.isModified('password')) {
    // Password unchanged — skip hashing (e.g., when updating name/phone only)
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err); // Pass error to Express error handler
  }
});

// ── Instance method: Compare a plain-text password against the stored hash ────
// Used during login to verify the password without exposing the hash.
//
// bcrypt.compare() takes the plain-text candidate and the hash from the database,
// re-computes the hash with the embedded salt, and returns true if they match.
// This is safe even if someone intercepts the hash — they cannot reverse it.
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── toJSON transform: strip sensitive fields from API responses ───────────────
// Whenever a User document is serialized to JSON (e.g., res.json(user)),
// this transform removes the password field automatically.
// This is a safety net in addition to select: false above.
userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.password;  // ← password hash NEVER appears in API responses
    delete ret.__v;       // ← Mongoose version key is not useful to clients
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
