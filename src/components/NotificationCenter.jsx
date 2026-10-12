// src/components/NotificationCenter.jsx — DriveFleet Notification Bell & Panel (Experiment 9)
//
// Features:
//   - Bell icon with animated unread count badge
//   - Dropdown panel showing persistent notifications from MongoDB
//   - Mark as read (single + all), delete notifications
//   - Real-time refresh when new notifications arrive via Socket.IO
//   - Auto-refresh on mount and when persistentRefreshKey changes

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Car, AlertCircle, CheckCircle, Info, Clock } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as deleteNotifAPI,
  deleteAllNotifications,
} from '../services/api';

export default function NotificationCenter() {
  const { isAuthenticated } = useAuth();
  const { persistentRefreshKey } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const panelRef = useRef(null);

  // ── Fetch unread count ──────────────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getUnreadCount();
      setUnreadCount(data?.count || 0);
    } catch {
      // Silently fail — badge will just show 0
    }
  }, [isAuthenticated]);

  // ── Fetch notifications list ────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await getNotifications(pageNum, 15);
      // The API returns the full response object since it has pagination
      const items = res?.data || res || [];
      const pagination = res?.pagination;

      if (append) {
        setNotifications((prev) => [...prev, ...items]);
      } else {
        setNotifications(items);
      }
      setPage(pageNum);
      setHasMore(pagination ? pagination.page < pagination.pages : false);
      if (res?.unreadCount !== undefined) {
        setUnreadCount(res.unreadCount);
      }
    } catch {
      if (!append) setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // ── Initial fetch & refresh on socket event ─────────────────────────────────
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount, persistentRefreshKey]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1);
    }
  }, [isOpen, fetchNotifications, persistentRefreshKey]);

  // ── Close panel when clicking outside ───────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn('Failed to mark notification as read:', err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all as read:', err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotifAPI(id);
      const was = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (was && !was.read) setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn('Failed to delete notification:', err.message);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to delete all notifications:', err.message);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchNotifications(page + 1, true);
    }
  };

  // ── Icon helper ─────────────────────────────────────────────────────────────
  const getTypeIcon = (type) => {
    switch (type) {
      case 'booking':
        return <Car size={16} className="text-blue-500" />;
      case 'status':
        return <Clock size={16} className="text-amber-500" />;
      case 'success':
        return <CheckCircle size={16} className="text-emerald-500" />;
      case 'warning':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'vehicle':
        return <Car size={16} className="text-indigo-500" />;
      default:
        return <Info size={16} className="text-slate-500" />;
    }
  };

  const getTypeBg = (type, read) => {
    if (read) return 'bg-white hover:bg-slate-50';
    switch (type) {
      case 'booking': return 'bg-blue-50/60 hover:bg-blue-50';
      case 'success': return 'bg-emerald-50/60 hover:bg-emerald-50';
      case 'warning': return 'bg-red-50/60 hover:bg-red-50';
      case 'status': return 'bg-amber-50/60 hover:bg-amber-50';
      default: return 'bg-slate-50/60 hover:bg-slate-50';
    }
  };

  const formatTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200 cursor-pointer"
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={20} className={isOpen ? 'text-blue-600' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-[380px] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 flex flex-col"
          style={{ animation: 'slideDown 0.2s ease-out' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck size={16} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Clear all"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs font-medium">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bell size={32} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs mt-1">You're all caught up! 🎉</p>
              </div>
            ) : (
              <>
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 transition-colors ${getTypeBg(n.type, n.read)}`}
                  >
                    <div className="mt-0.5 p-1.5 bg-white rounded-lg shadow-xs shrink-0">
                      {getTypeIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                        )}
                        <p className="text-xs font-bold text-slate-800 truncate">{n.title}</p>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{formatTimeAgo(n.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                      {!n.read && (
                        <button
                          onClick={() => handleMarkRead(n._id)}
                          className="p-1 rounded-md text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Mark as read"
                        >
                          <Check size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(n._id)}
                        className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Load More */}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Animation keyframes (injected once) */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
