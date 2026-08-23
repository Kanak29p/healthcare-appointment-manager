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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-tr from-indigo-650 to-violet-550 rounded-xl text-white">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-white to-indigo-400 bg-clip-text text-transparent">
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
                    ? 'bg-indigo-650 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
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
                    ? 'bg-indigo-650 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
                }`
              }
            >
              <CalendarDays className="h-4 w-4" />
              <span>My Appointments</span>
            </NavLink>
          </nav>

          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/50 text-indigo-400 border border-indigo-950/20">
              Patient Portal
            </span>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-2 text-sm text-slate-450 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav links below header */}
      <div className="md:hidden border-b border-slate-900 bg-slate-900/30 py-2.5 px-4 flex justify-around">
        <NavLink
          to="/patient/doctors"
          className={({ isActive }) =>
            `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              isActive ? 'bg-indigo-650 text-white' : 'text-slate-400'
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
              isActive ? 'bg-indigo-650 text-white' : 'text-slate-400'
            }`
          }
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>My Appointments</span>
        </NavLink>
      </div>

      {/* Page Body Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© AegisHealth Patient Portal. Secured session.</p>
      </footer>
    </div>
  );
}
