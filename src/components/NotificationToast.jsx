// src/components/NotificationToast.jsx — Floating Real-Time Alerts (Experiment 8)
import { useSocket } from '../hooks/useSocket';
import { Bell, CheckCircle, Car, AlertCircle, X } from 'lucide-react';

export default function NotificationToast() {
  const { notifications, dismissNotification } = useSocket();

  if (!notifications || notifications.length === 0) {
    return null;
  }

  const getIcon = (type) => {
    switch (type) {
      case 'booking':
        return <Car size={18} className="text-blue-600" />;
      case 'status':
        return <CheckCircle size={18} className="text-emerald-600" />;
      case 'vehicle':
        return <AlertCircle size={18} className="text-amber-600" />;
      default:
        return <Bell size={18} className="text-indigo-600" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'booking':
        return 'border-blue-500/30 bg-blue-50/90';
      case 'status':
        return 'border-emerald-500/30 bg-emerald-50/90';
      case 'vehicle':
        return 'border-amber-500/30 bg-amber-50/90';
      default:
        return 'border-slate-300 bg-white/95';
    }
  };

  return (
    <aside aria-label="Notifications" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`pointer-events-auto backdrop-blur-md border rounded-2xl p-4 shadow-xl flex items-start gap-3 transition-all transform animate-in fade-in slide-in-from-bottom-3 duration-300 ${getBorderColor(
            n.type
          )}`}
        >
          <div className="p-2 bg-white rounded-xl shadow-xs shrink-0">
            {getIcon(n.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">{n.title}</p>
            </div>
            <p className="text-xs text-slate-600 leading-snug">{n.message}</p>
          </div>
          <button
            onClick={() => dismissNotification(n.id)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-black/5 transition-colors shrink-0"
            title="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </aside>
  );
}
