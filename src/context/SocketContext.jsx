// src/context/SocketContext.jsx — Real-Time Socket.IO Context Provider (Experiment 8)
//
// Features:
//   - Authenticates socket connection using existing JWT token from AuthContext
//   - Manages connection lifecycle (connected, disconnected, error, reconnect)
//   - Ingests real-time events: bookingCreated, bookingStatusUpdated, vehicleAvailabilityUpdated
//   - Provides real-time notification queue for live dashboard alerts
//   - Cleans up socket listeners on unmount

import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { connectSocket, disconnectSocket } from '../services/socket';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user, isAuthenticated } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Ref to track latest notifications without triggering re-subscriptions
  const notificationsRef = useRef(notifications);
  notificationsRef.current = notifications;

  /**
   * Add a real-time notification to the live toast queue
   */
  const addNotification = useCallback((notification) => {
    const id = Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const newNotif = {
      id,
      timestamp: new Date(),
      read: false,
      ...notification,
    };

    setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]); // Keep last 20 notifications

    // Auto-dismiss toast notification after 6 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  }, []);

  /**
   * Dismiss single notification
   */
  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  /**
   * Clear all notifications
   */
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // ── Establish or teardown socket on authentication state change ─────────────
  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      return;
    }

    const sock = connectSocket(token);
    if (!sock) return;

    setSocket(sock);

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = (err) => {
      setIsConnected(false);
      setConnectionError(err.message || 'Connection error');
      console.warn('🔌 [Socket.IO Client] Connection error:', err.message);
    };

    // ── Real-time event listeners ─────────────────────────────────────────────
    const handleBookingCreated = (booking) => {
      const isManager = user && ['fleet_manager', 'manager', 'admin'].includes(user.role);
      const isMyBooking = user && (booking.customerId === user.id || booking.customerEmail === user.email);

      if (isManager) {
        addNotification({
          type: 'booking',
          title: 'New Booking Received',
          message: `${booking.customerName} reserved ${booking.vehicleName} (₹${(booking.totalAmount || 0).toLocaleString()})`,
          data: booking,
        });
      } else if (isMyBooking) {
        addNotification({
          type: 'success',
          title: 'Booking Confirmed',
          message: `Your reservation for ${booking.vehicleName} has been received.`,
          data: booking,
        });
      }
    };

    const handleBookingStatusUpdated = (booking) => {
      const isManager = user && ['fleet_manager', 'manager', 'admin'].includes(user.role);
      const isMyBooking = user && (booking.customerId === user.id || booking.customerEmail === user.email);

      if (isManager || isMyBooking) {
        addNotification({
          type: 'status',
          title: 'Booking Status Updated',
          message: `${booking.vehicleName} booking is now marked as ${booking.status}.`,
          data: booking,
        });
      }
    };

    const handleVehicleAvailability = (vehicle) => {
      addNotification({
        type: 'vehicle',
        title: 'Vehicle Status Changed',
        message: `${vehicle.name} is now ${vehicle.status}.`,
        data: vehicle,
      });
    };

    sock.on('connect', handleConnect);
    sock.on('disconnect', handleDisconnect);
    sock.on('connect_error', handleConnectError);
    sock.on('bookingCreated', handleBookingCreated);
    sock.on('bookingStatusUpdated', handleBookingStatusUpdated);
    sock.on('vehicleAvailabilityUpdated', handleVehicleAvailability);

    if (sock.connected) {
      setIsConnected(true);
    }

    return () => {
      sock.off('connect', handleConnect);
      sock.off('disconnect', handleDisconnect);
      sock.off('connect_error', handleConnectError);
      sock.off('bookingCreated', handleBookingCreated);
      sock.off('bookingStatusUpdated', handleBookingStatusUpdated);
      sock.off('vehicleAvailabilityUpdated', handleVehicleAvailability);
    };
  }, [isAuthenticated, token, user, addNotification]);

  const value = {
    socket,
    isConnected,
    connectionError,
    notifications,
    addNotification,
    dismissNotification,
    clearNotifications,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
