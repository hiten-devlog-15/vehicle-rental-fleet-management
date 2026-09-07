// config/db.js — MongoDB connection using Mongoose
// The connection string is loaded from .env so credentials are never hardcoded.

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Exit process with failure so the server doesn't run without a database
    process.exit(1);
  }
};

module.exports = connectDB;
