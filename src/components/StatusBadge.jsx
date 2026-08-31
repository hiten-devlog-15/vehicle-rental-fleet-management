// StatusBadge component — color-coded booking/vehicle status pills

const statusConfig = {
  // Booking statuses
  Pending:     { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  Confirmed:   { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  Active:      { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Completed:   { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400'   },
  Cancelled:   { bg: 'bg-red-100',     text: 'text-red-600',     dot: 'bg-red-400'     },
  // Vehicle statuses
  Available:   { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Booked:      { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  Rented:      { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  Maintenance: { bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-400'  },
  // Maintenance statuses
  Scheduled:   { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  'In Progress': { bg: 'bg-blue-100',  text: 'text-blue-700',    dot: 'bg-blue-500'    },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  };

  const textSize = size === 'xs' ? 'text-xs' : 'text-xs';
  const px = size === 'xs' ? 'px-2 py-0.5' : 'px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${textSize} ${px}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}
