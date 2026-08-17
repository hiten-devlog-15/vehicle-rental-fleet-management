// DashboardCard — stat summary card for dashboard pages

export default function DashboardCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue:    { bg: 'bg-blue-50',    icon: 'bg-blue-100 text-blue-600',    value: 'text-blue-700'    },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', value: 'text-emerald-700' },
    amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-100 text-amber-600',   value: 'text-amber-700'   },
    red:     { bg: 'bg-red-50',     icon: 'bg-red-100 text-red-600',       value: 'text-red-700'     },
    violet:  { bg: 'bg-violet-50',  icon: 'bg-violet-100 text-violet-600', value: 'text-violet-700'  },
    slate:   { bg: 'bg-slate-50',   icon: 'bg-slate-100 text-slate-600',   value: 'text-slate-700'   },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`${c.bg} rounded-2xl p-5 border border-white shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${c.value}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-2 font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${c.icon}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}
