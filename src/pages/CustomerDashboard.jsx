import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardCard from '../components/DashboardCard';
import StatusBadge from '../components/StatusBadge';
import { bookings } from '../data/bookings';
import { vehicles } from '../data/vehicles';
import {
  Car, Calendar, CheckCircle, Clock, ChevronRight,
  Bell, User, MapPin,
} from 'lucide-react';

const customerBookings = bookings.filter((b) => b.customerId === 'C001');
const activeBooking = customerBookings.find((b) => b.status === 'Active');
const activeVehicle = activeBooking ? vehicles.find((v) => v.id === activeBooking.vehicleId) : null;

export default function CustomerDashboard() {
  const stats = [
    { title: 'Total Bookings',     value: customerBookings.length, icon: Calendar, color: 'blue',    trend: 20 },
    { title: 'Active Rental',      value: customerBookings.filter((b) => b.status === 'Active').length, icon: Car, color: 'emerald', trend: 0 },
    { title: 'Completed Rentals',  value: customerBookings.filter((b) => b.status === 'Completed').length, icon: CheckCircle, color: 'slate', trend: 33 },
    { title: 'Upcoming Bookings',  value: customerBookings.filter((b) => b.status === 'Confirmed').length, icon: Clock, color: 'amber', trend: 0 },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar role="customer" />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-bold text-slate-800">My Dashboard</h1>
            <p className="text-xs text-slate-500">Welcome back, Arjun Sharma 👋</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-700">Arjun Sharma</p>
                <p className="text-xs text-slate-400">Customer</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <DashboardCard key={s.title} {...s} />
            ))}
          </div>

          {/* Active rental card */}
          {activeBooking && activeVehicle && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <img
                    src={activeVehicle.image}
                    alt={activeVehicle.name}
                    className="w-20 h-14 object-cover rounded-xl"
                    onError={(e) => { e.target.src = 'https://placehold.co/80x56/1d4ed8/fff?text=Car'; }}
                  />
                  <div>
                    <p className="text-blue-200 text-xs font-semibold mb-0.5">Currently Active Rental</p>
                    <h3 className="font-bold text-lg">{activeVehicle.name}</h3>
                    <p className="text-blue-200 text-sm">{activeVehicle.type} · {activeVehicle.transmission}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  <StatusBadge status="Active" />
                  <div className="flex items-center gap-2 text-blue-100 text-sm">
                    <Calendar size={14} />
                    <span>Until {new Date(activeBooking.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-100 text-sm">
                    <MapPin size={14} />
                    <span className="truncate max-w-40">{activeBooking.pickupLocation}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent bookings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Recent Bookings</h2>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                View all <ChevronRight size={14} />
              </button>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Booking ID', 'Vehicle', 'Pickup', 'Return', 'Amount', 'Status'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-blue-600 font-semibold">{b.id}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-700">{b.vehicleName}</td>
                      <td className="px-5 py-3.5 text-slate-500">{b.pickupDate}</td>
                      <td className="px-5 py-3.5 text-slate-500">{b.returnDate}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">₹{b.totalAmount.toLocaleString()}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-100">
              {customerBookings.map((b) => (
                <div key={b.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{b.vehicleName}</p>
                      <p className="text-xs text-slate-400 font-mono">{b.id}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{b.pickupDate} → {b.returnDate}</span>
                    <span className="font-semibold text-slate-700">₹{b.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
