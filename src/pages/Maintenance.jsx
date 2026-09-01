// Maintenance.jsx — RBAC: uses useAuth for user info display
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import Button from '../components/Button';
import DashboardCard from '../components/DashboardCard';
import { maintenanceRecords, maintenanceTypes, maintenanceStatuses } from '../data/maintenance';
import { useVehicles } from '../hooks/useVehicles';
import { useAuth } from '../hooks/useAuth';
import { Wrench, Plus, CalendarClock, IndianRupee, CheckCircle, AlertCircle } from 'lucide-react';

export default function Maintenance() {
  const { vehicles } = useVehicles();
  const { user } = useAuth();
  const displayName = user?.name || 'Fleet Manager';
  const displayRole = user?.role ? user.role.replace(/_/g, ' ') : 'Fleet Manager';
  const [records, setRecords] = useState(maintenanceRecords);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    vehicleId: '', type: '', date: '', cost: '', technician: '',
    nextServiceDate: '', status: 'Scheduled', notes: '',
  });

  // useEffect — document title (Experiment 2)
  useEffect(() => {
    document.title = 'DriveFleet | Maintenance';
    return () => { document.title = 'DriveFleet'; };
  }, []);

  const stats = [
    { title: 'Total Records',   value: records.length, icon: Wrench,        color: 'blue'    },
    { title: 'Completed',       value: records.filter((r) => r.status === 'Completed').length, icon: CheckCircle, color: 'emerald' },
    { title: 'In Progress',     value: records.filter((r) => r.status === 'In Progress').length, icon: AlertCircle, color: 'amber' },
    { title: 'Scheduled',       value: records.filter((r) => r.status === 'Scheduled').length, icon: CalendarClock, color: 'violet' },
  ];

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleAdd = () => {
    if (!form.vehicleId || !form.type || !form.date) return;
    const vehicle = vehicles.find((v) => v.id === form.vehicleId);
    const id = `MN-${String(records.length + 1).padStart(3, '0')}`;
    setRecords((prev) => [
      ...prev,
      {
        id,
        vehicleId: form.vehicleId,
        vehicleName: vehicle?.name || '—',
        registrationNo: vehicle?.registrationNo || '—',
        type: form.type,
        date: form.date,
        cost: Number(form.cost) || 0,
        technician: form.technician,
        nextServiceDate: form.nextServiceDate,
        odometer: 0,
        status: form.status,
        notes: form.notes,
      },
    ]);
    setShowModal(false);
    setForm({ vehicleId: '', type: '', date: '', cost: '', technician: '', nextServiceDate: '', status: 'Scheduled', notes: '' });
  };

  const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Maintenance</h1>
            <p className="text-xs text-slate-500">Track vehicle service and maintenance records</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              id="maintenance-add-btn"
              onClick={() => setShowModal(true)}
              size="sm"
              icon={Plus}
            >
              Add Record
            </Button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{user?.avatar || 'FM'}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-700">{displayName}</p>
                <p className="text-xs text-slate-400 capitalize">{displayRole}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => <DashboardCard key={s.title} {...s} />)}
          </div>

          {/* Records table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Maintenance Records</h2>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['ID', 'Vehicle', 'Type', 'Date', 'Cost', 'Technician', 'Next Service', 'Status'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-blue-600 font-semibold">{r.id}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-800 whitespace-nowrap">{r.vehicleName}</p>
                        <p className="text-xs text-slate-400 font-mono">{r.registrationNo}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{r.type}</td>
                      <td className="px-5 py-3.5 text-slate-500">{r.date}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">₹{r.cost.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{r.technician}</td>
                      <td className="px-5 py-3.5 text-slate-500">{r.nextServiceDate || '—'}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-100">
              {records.map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{r.vehicleName}</p>
                      <p className="text-xs text-slate-400">{r.type} · {r.date}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{r.technician || '—'}</span>
                    <span className="font-semibold text-slate-700">₹{r.cost.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Maintenance Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Maintenance Record" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="maint-vehicle" className="block text-sm font-medium text-slate-700 mb-1.5">Vehicle *</label>
            <select id="maint-vehicle" value={form.vehicleId} onChange={update('vehicleId')} className={inputCls}>
              <option value="">Select vehicle...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.registrationNo})</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="maint-type" className="block text-sm font-medium text-slate-700 mb-1.5">Maintenance Type *</label>
            <select id="maint-type" value={form.type} onChange={update('type')} className={inputCls}>
              <option value="">Select type...</option>
              {maintenanceTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="maint-date" className="block text-sm font-medium text-slate-700 mb-1.5">Date *</label>
            <input id="maint-date" type="date" value={form.date} onChange={update('date')} className={inputCls} />
          </div>

          <div>
            <label htmlFor="maint-cost" className="block text-sm font-medium text-slate-700 mb-1.5">Cost (₹)</label>
            <input id="maint-cost" type="number" value={form.cost} onChange={update('cost')} placeholder="e.g., 2500" className={inputCls} />
          </div>

          <div>
            <label htmlFor="maint-tech" className="block text-sm font-medium text-slate-700 mb-1.5">Technician Name</label>
            <input id="maint-tech" type="text" value={form.technician} onChange={update('technician')} placeholder="e.g., Suresh Kumar" className={inputCls} />
          </div>

          <div>
            <label htmlFor="maint-next" className="block text-sm font-medium text-slate-700 mb-1.5">Next Service Date</label>
            <input id="maint-next" type="date" value={form.nextServiceDate} onChange={update('nextServiceDate')} className={inputCls} />
          </div>

          <div>
            <label htmlFor="maint-status" className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <select id="maint-status" value={form.status} onChange={update('status')} className={inputCls}>
              {maintenanceStatuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="maint-notes" className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea
              id="maint-notes"
              rows={3}
              value={form.notes}
              onChange={update('notes')}
              placeholder="Describe the maintenance work performed..."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="sm:col-span-2 flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setShowModal(false)}>Cancel</Button>
            <Button fullWidth onClick={handleAdd}>Add Record</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
