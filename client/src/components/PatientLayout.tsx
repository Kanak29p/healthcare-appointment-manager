import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Activity, LogOut, Search, CalendarDays } from 'lucide-react';

export default function PatientLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    api.logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3">
              <div className="p-2 bg-teal-600 rounded-xl text-white">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-slate-900">
                AegisHealth
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-2">
            <NavLink
              to="/patient/doctors"
              className={({ isActive }) =>
                `flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Search className="h-4 w-4" />
              <span>Find Doctor</span>
            </NavLink>

            <NavLink
              to="/patient/appointments"
              className={({ isActive }) =>
                `flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <CalendarDays className="h-4 w-4" />
              <span>My Appointments</span>
            </NavLink>
          </nav>

          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100">
              Patient Portal
            </span>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav links below header */}
      <div className="md:hidden border-b border-slate-200 bg-white py-2.5 px-4 flex justify-around">
        <NavLink
          to="/patient/doctors"
          className={({ isActive }) =>
            `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              isActive ? 'bg-teal-600 text-white' : 'text-slate-650 hover:bg-slate-100'
            }`
          }
        >
          <Search className="h-3.5 w-3.5" />
          <span>Find Doctor</span>
        </NavLink>
        <NavLink
          to="/patient/appointments"
          className={({ isActive }) =>
            `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              isActive ? 'bg-teal-600 text-white' : 'text-slate-655 hover:bg-slate-100'
            }`
          }
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>My Appointments</span>
        </NavLink>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>© AegisHealth. Secure Patient Portal session.</p>
      </footer>
    </div>
  );
}
