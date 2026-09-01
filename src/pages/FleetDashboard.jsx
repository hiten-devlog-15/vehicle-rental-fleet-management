// FleetDashboard.jsx — Experiment 2 & 3: uses useAuth, useVehicles, useBookings
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DashboardCard from '../components/DashboardCard';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { useVehicles } from '../hooks/useVehicles';
import { useBookings } from '../hooks/useBookings';
import {
  Car, CheckCircle, Wrench, PauseCircle,
  Plus, Pencil, Trash2, Eye, Bell, User, Search, LogIn, Calendar,
} from 'lucide-react';

export default function FleetDashboard() {
  const {
    vehicles,
    addVehicle,
    removeVehicle,
    updateVehicle,
    updateVehicleStatus,
  } = useVehicles();
  const { bookings } = useBookings();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [newVehicle, setNewVehicle] = useState({
    name: '', registrationNo: '', type: '', fleetStatus: 'Available', pricePerDay: '',
  });

  // useAuth — Custom Hook consuming AuthContext (Experiment 2)
  const { user, isAuthenticated } = useAuth();

  // useEffect — document title (Experiment 2)
  useEffect(() => {
    document.title = 'DriveFleet | Fleet Dashboard';
    return () => { document.title = 'DriveFleet'; };
  }, []);

  const stats = [
    { title: 'Total Vehicles',      value: vehicles.length, icon: Car,         color: 'blue'    },
    { title: 'Available',           value: vehicles.filter((v) => v.status === 'Available').length, icon: CheckCircle, color: 'emerald' },
    { title: 'Booked Vehicles',     value: vehicles.filter((v) => v.status === 'Booked').length, icon: PauseCircle, color: 'amber'   },
    { title: 'Under Maintenance',   value: vehicles.filter((v) => v.status === 'Maintenance').length, icon: Wrench, color: 'red' },
    { title: 'Total Bookings',      value: bookings.length, icon: Calendar,    color: 'indigo'  },
  ];

  const filtered = vehicles.filter((v) =>
    !searchQuery ||
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.registrationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id) => {
    if (window.confirm('Delete this vehicle from the fleet?')) {
      removeVehicle(id);
    }
  };

  const handleAddVehicle = () => {
    if (!newVehicle.name || !newVehicle.registrationNo) return;
    const id = `v${Date.now()}`;
    addVehicle({
      id,
      name: newVehicle.name,
      registrationNo: newVehicle.registrationNo,
      type: newVehicle.type || 'SUV',
      pricePerDay: Number(newVehicle.pricePerDay) || 0,
      status: newVehicle.fleetStatus,
      available: newVehicle.fleetStatus === 'Available',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80',
      fuel: 'Petrol',
      transmission: 'Manual',
      seats: 5,
      rating: 4.0,
      reviews: 0,
      brand: newVehicle.name.split(' ')[0] || 'Generic',
      mileage: '15.0 kmpl',
      description: 'Newly added fleet vehicle.',
      features: ['Air Conditioning', 'Power Steering'],
    });
    setShowAddModal(false);
    setNewVehicle({ name: '', registrationNo: '', type: '', fleetStatus: 'Available', pricePerDay: '' });
  };

  const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

  // Display name from auth context or fallback
  const displayName = user?.name || 'Rajan Verma';
  const displayRole = user?.role ? user.role.replace('_', ' ') : 'Fleet Manager';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Fleet Dashboard</h1>
            {/* useContext value displayed here (Experiment 2) */}
            <p className="text-xs text-slate-500">
              {isAuthenticated
                ? <>Welcome, <span className="font-semibold text-blue-600">{displayName}</span></>
                : 'Manage your entire vehicle fleet'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              id="fleet-add-vehicle-btn"
              onClick={() => setShowAddModal(true)}
              size="sm"
              icon={Plus}
            >
              Add Vehicle
            </Button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                {isAuthenticated ? (
                  <span className="text-white text-xs font-bold">{user?.avatar || 'FM'}</span>
                ) : (
                  <User size={14} className="text-white" />
                )}
              </div>
              <div className="hidden sm:block">
                {/* useContext data rendered in header */}
                <p className="text-xs font-semibold text-slate-700">{displayName}</p>
                <p className="text-xs text-slate-400 capitalize">{displayRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Not logged in — show prompt */}
        {!isAuthenticated && (
          <div className="m-6 p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4">
            <div className="p-2.5 bg-amber-100 rounded-xl">
              <LogIn size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800">You are not logged in</p>
              <p className="text-sm text-amber-600 mt-0.5">
                Log in as <strong>Fleet Manager</strong> to manage your fleet.{' '}
                <Link to="/login" className="font-bold underline hover:text-amber-800">Sign in now →</Link>
              </p>
            </div>
          </div>
        )}

        {/* Logged-in context banner */}
        {isAuthenticated && (
          <div className="mx-6 mt-5 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              Experiment 2 — useContext in action
            </p>
            <p className="text-sm text-slate-700">
              Logged in as: <strong>{user.name}</strong> &nbsp;·&nbsp;
              Role: <strong className="capitalize">{user.role.replace('_', ' ')}</strong> &nbsp;·&nbsp;
              ID: <code className="text-blue-600">{user.id}</code>
            </p>
          </div>
        )}

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => <DashboardCard key={s.title} {...s} />)}
          </div>

          {/* Vehicle management table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Vehicle Management</h2>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="fleet-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search vehicles..."
                  className="pl-8 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56"
                />
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Vehicle ID', 'Name', 'Reg. No.', 'Type', 'Status', 'Price/Day', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-blue-600 font-semibold">{v.id}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800 whitespace-nowrap">{v.name}</td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{v.registrationNo}</td>
                      <td className="px-5 py-3.5 text-slate-500">{v.type}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={v.status} />
                          <select
                            value={v.status}
                            onChange={(e) => updateVehicleStatus(v.id, e.target.value)}
                            className="mt-1 text-xs border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
                          >
                            <option value="Available">Available</option>
                            <option value="Booked">Booked</option>
                            <option value="Maintenance">Maintenance</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">₹{v.pricePerDay.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            id={`fleet-view-${v.id}`}
                            title="View Details"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            id={`fleet-edit-${v.id}`}
                            title="Edit"
                            onClick={() => setEditVehicle(v)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            id={`fleet-delete-${v.id}`}
                            title="Delete"
                            onClick={() => handleDelete(v.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filtered.map((v) => (
                <div key={v.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{v.name}</p>
                      <p className="text-xs text-slate-400">{v.type} · {v.registrationNo}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={v.status} />
                      <select
                        value={v.status}
                        onChange={(e) => updateVehicleStatus(v.id, e.target.value)}
                        className="text-xs border border-slate-200 rounded px-1 bg-white cursor-pointer"
                      >
                        <option value="Available">Available</option>
                        <option value="Booked">Booked</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">₹{v.pricePerDay.toLocaleString()}/day</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditVehicle(v)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Vehicle" size="sm">
        <div className="space-y-4">
          {[
            { id: 'add-name', label: 'Vehicle Name *', key: 'name', placeholder: 'e.g., Honda City' },
            { id: 'add-reg', label: 'Registration No. *', key: 'registrationNo', placeholder: 'e.g., MH-01-AB-1234' },
            { id: 'add-type', label: 'Vehicle Type', key: 'type', placeholder: 'e.g., Sedan, SUV' },
            { id: 'add-price', label: 'Price Per Day (₹)', key: 'pricePerDay', placeholder: '2500', type: 'number' },
          ].map(({ id, label, key, placeholder, type = 'text' }) => (
            <div key={key}>
              <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
              <input
                id={id}
                type={type}
                value={newVehicle[key]}
                onChange={(e) => setNewVehicle({ ...newVehicle, [key]: e.target.value })}
                placeholder={placeholder}
                className={inputCls}
              />
            </div>
          ))}
          <div>
            <label htmlFor="add-status" className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <select
              id="add-status"
              value={newVehicle.fleetStatus}
              onChange={(e) => setNewVehicle({ ...newVehicle, fleetStatus: e.target.value })}
              className={inputCls}
            >
              <option value="Available">Available</option>
              <option value="Booked">Booked</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button fullWidth onClick={handleAddVehicle}>Add Vehicle</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal isOpen={!!editVehicle} onClose={() => setEditVehicle(null)} title="Edit Vehicle" size="sm">
        {editVehicle && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Vehicle Name</label>
              <input
                id="edit-name"
                type="text"
                value={editVehicle.name}
                onChange={(e) => setEditVehicle({ ...editVehicle, name: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                id="edit-status"
                value={editVehicle.status || (editVehicle.available ? 'Available' : 'Booked')}
                onChange={(e) => setEditVehicle({ ...editVehicle, status: e.target.value, available: e.target.value === 'Available' })}
                className={inputCls}
              >
                <option value="Available">Available</option>
                <option value="Booked">Booked</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Price Per Day (₹)</label>
              <input
                id="edit-price"
                type="number"
                value={editVehicle.pricePerDay}
                onChange={(e) => setEditVehicle({ ...editVehicle, pricePerDay: Number(e.target.value) })}
                className={inputCls}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" fullWidth onClick={() => setEditVehicle(null)}>Cancel</Button>
              <Button fullWidth onClick={() => {
                updateVehicle(editVehicle);
                setEditVehicle(null);
              }}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
