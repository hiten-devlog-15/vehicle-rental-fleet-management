// config/db.js — MongoDB connection using Mongoose
// The connection string is loaded from .env so credentials are never hardcoded.
const dns = require('node:dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME || 'drivefleet',
    });
    console.log(`MongoDB connected successfully: ${conn.connection.host} [Database: ${conn.connection.name}]`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Exit process with failure so the server doesn't run without a database
    process.exit(1);
  }
};

module.exports = connectDB;
