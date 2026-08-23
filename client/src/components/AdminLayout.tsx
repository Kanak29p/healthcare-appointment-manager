import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Activity, LayoutDashboard, Stethoscope, LogOut } from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    api.logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-850">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-lg text-white">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-white to-indigo-400 bg-clip-text text-transparent">
                AegisHealth
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-650 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
                }`
              }
            >
              <LayoutDashboard className="h-4.5 w-4.5" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/admin/doctors"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-650 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
                }`
              }
            >
              <Stethoscope className="h-4.5 w-4.5" />
              <span>Doctors</span>
            </NavLink>
          </nav>
        </div>

        {/* Footer/Logout */}
        <div className="p-4 border-t border-slate-850">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-450 hover:bg-rose-950/20 transition-all cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-h-screen overflow-x-hidden">
        {/* Header bar */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/60 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Admin Console
          </span>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">System Operator Session</span>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <main className="flex-grow p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
