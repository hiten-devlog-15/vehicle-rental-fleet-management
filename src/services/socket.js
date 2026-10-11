// src/services/socket.js — Socket.IO Client Service for DriveFleet (Experiment 8)
//
// Features:
//   - Singleton Socket.IO client instance
//   - JWT authentication via handshake auth payload
//   - Auto-reconnection configuration
//   - Safe connect/disconnect helpers

import { io } from 'socket.io-client';

let socketInstance = null;
let currentToken = null;

// Determine backend URL (strip trailing /api for Socket.IO connection)
const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

/**
 * Initialize or reuse Socket.IO client connection with JWT token
 * @param {string} token - Valid JWT Bearer token
 * @returns {Socket} - Active Socket.IO client instance
 */
export const connectSocket = (token) => {
  if (!token) {
    disconnectSocket();
    return null;
  }

  // Reuse existing connection if token has not changed and socket is connected
  if (socketInstance && currentToken === token && socketInstance.connected) {
    return socketInstance;
  }

  // If token changed or previous socket exists, disconnect first
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  currentToken = token;
  const socketUrl = getSocketUrl();

  socketInstance = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  return socketInstance;
};

/**
 * Disconnect and destroy current socket connection
 */
export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
  currentToken = null;
};

/**
 * Get the current active socket instance (or null)
 */
export const getSocket = () => socketInstance;
