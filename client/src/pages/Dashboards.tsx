import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { FullUser } from '../services/api';
import { Activity, LogOut, User as UserIcon, RefreshCw, AlertCircle, Calendar } from 'lucide-react';

interface DashboardFrameProps {
  title: string;
  roleIcon: React.ReactNode;
  roleBg: string;
  roleText: string;
  children: (user: FullUser) => React.ReactNode;
}

function DashboardFrame({ title, roleIcon, roleBg, roleText, children }: DashboardFrameProps) {
  const [user, setUser] = useState<FullUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.getMe();
        setUser(response.user);
      } catch (err: any) {
        console.error(err);
        setError('Session expired or unauthorized. Please sign in again.');
        api.logout();
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    api.logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans">
        <RefreshCw className="animate-spin h-8 w-8 text-indigo-500 mb-4" />
        <p className="text-slate-400 text-sm">Verifying session details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center shadow-xl">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Authentication Error</h2>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-white rounded-xl transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl text-white">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-white to-indigo-400 bg-clip-text text-transparent">
              AegisHealth
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${roleBg} ${roleText} border border-indigo-950/20`}>
              {roleIcon}
              <span className="ml-1.5">{user?.role}</span>
            </span>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-900 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-900 pb-6 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{title}</h1>
              <p className="text-slate-400 mt-1 text-sm">Welcome back, {user?.name}</p>
            </div>
            <div className="mt-4 sm:mt-0 text-xs text-slate-500 font-mono">
              User ID: {user?.id}
            </div>
          </div>

          {/* Render Page Contents */}
          {user && children(user)}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© AegisHealth. Dashboard Portal. Secured session.</p>
      </footer>
    </div>
  );
}

// 1. Patient Dashboard
export function PatientDashboard() {
  return (
    <DashboardFrame
      title="Patient Dashboard"
      roleIcon={<UserIcon className="h-3.5 w-3.5" />}
      roleBg="bg-indigo-950/50"
      roleText="text-indigo-400"
    >
      {(user: FullUser) => (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-slate-950 border border-slate-900">
            <h3 className="text-base font-bold text-white mb-4">Patient Profile Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Full Name:</span>
                <p className="text-slate-200 font-medium">{user.name}</p>
              </div>
              <div>
                <span className="text-slate-500">Email Address:</span>
                <p className="text-slate-200 font-medium">{user.email}</p>
              </div>
              <div>
                <span className="text-slate-500">Phone Number:</span>
                <p className="text-slate-200 font-medium">{user.patientProfile?.phone || 'Not Provided'}</p>
              </div>
              <div>
                <span className="text-slate-500">Gender:</span>
                <p className="text-slate-200 font-medium">{user.patientProfile?.gender || 'Not Specified'}</p>
              </div>
              <div>
                <span className="text-slate-500">Date of Birth:</span>
                <p className="text-slate-200 font-medium">
                  {user.patientProfile?.dateOfBirth 
                    ? new Date(user.patientProfile.dateOfBirth).toLocaleDateString() 
                    : 'Not Specified'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-slate-950 border border-slate-900 text-center py-10">
            <p className="text-slate-400 text-sm">No upcoming appointments or follow-ups scheduled yet.</p>
            <p className="text-xs text-slate-500 mt-2">Appointments features will be implemented in Part 4.</p>
          </div>
        </div>
      )}
    </DashboardFrame>
  );
}

// 2. Doctor Dashboard
export function DoctorDashboard() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchDoctorAppointments = async () => {
    try {
      const data = await api.getDoctorAppointments();
      setAppointments(data.appointments);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch your schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorAppointments();
  }, []);

  const handleLogout = () => {
    api.logout();
    navigate('/');
  };

  const formatTimeStr = (isoStr: string) => {
    const d = new Date(isoStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-605 to-violet-555 rounded-xl text-white">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-white to-indigo-400 bg-clip-text text-transparent">
              AegisHealth
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-violet-955/50 text-violet-400 border border-violet-950/20">
              Practitioner Portal
            </span>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-2 text-sm text-slate-450 hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Consultations Schedule</h1>
            <p className="text-slate-400 text-sm mt-1">Review upcoming appointments and check patient symptom logs.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-20">
              <RefreshCw className="animate-spin h-7 w-7 text-indigo-500 mr-3" />
              <span className="text-slate-400">Loading schedules...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-955/40 border border-rose-900/50 text-rose-455 text-sm">
              {error}
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-sm">
              <Calendar className="h-10 w-10 text-slate-650 mx-auto mb-4" />
              <p className="font-semibold text-white">No Appointments Booked</p>
              <p className="text-xs text-slate-550 mt-1">Your upcoming appointment slot listings will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white text-sm">{appt.patientName}</h4>
                        <p className="text-slate-450 text-xs mt-0.5">{appt.patientEmail}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-950/20">
                        {appt.status}
                      </span>
                    </div>

                    <div className="mt-3.5 space-y-2 text-xs text-slate-350">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Scheduled:</span>
                        <span className="font-mono text-slate-300">
                          {new Date(appt.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} | {formatTimeStr(appt.startTime)} - {formatTimeStr(appt.endTime)} (UTC)
                        </span>
                      </div>
                      {appt.symptoms && (
                        <div className="mt-2 pt-2 border-t border-slate-850">
                          <span className="text-slate-550 block mb-1 font-semibold text-[11px] uppercase tracking-wider">Patient Symptoms:</span>
                          <p className="text-slate-400 italic bg-slate-955/30 p-2 rounded text-xs leading-normal">
                            "{appt.symptoms}"
                          </p>
                        </div>
                      )}

                      {appt.aiSummary && (
                        <div className="mt-3 pt-3 border-t border-slate-850 space-y-2">
                          <span className="text-indigo-400 block text-[11px] font-bold uppercase tracking-wider">
                            AI Pre-Visit Summary
                          </span>
                          {appt.aiSummary.status === 'SUCCESS' ? (
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="text-slate-500">Urgency:</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  appt.aiSummary.urgency === 'HIGH' 
                                    ? 'bg-rose-950 text-rose-400 border border-rose-900/50' 
                                    : appt.aiSummary.urgency === 'MEDIUM'
                                      ? 'bg-amber-950 text-amber-400 border border-amber-900/50'
                                      : 'bg-emerald-950 text-emerald-400 border border-emerald-900/50'
                                }`}>
                                  {appt.aiSummary.urgency}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block mb-0.5">Chief Complaint:</span>
                                <p className="text-slate-300 bg-slate-950 p-2 rounded font-medium">
                                  {appt.aiSummary.chiefComplaint}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-500 block mb-1">Suggested Questions:</span>
                                <ol className="list-decimal list-inside space-y-1 text-slate-350 bg-slate-950 p-2 rounded">
                                  {appt.aiSummary.suggestedQuestions?.map((q: string, i: number) => (
                                    <li key={i} className="leading-normal">{q}</li>
                                  ))}
                                </ol>
                              </div>
                            </div>
                          ) : (
                            <p className="text-rose-400 text-xs italic bg-rose-955/20 p-2 rounded border border-rose-950/20">
                              AI pre-visit summary is temporarily unavailable.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// 3. Admin Dashboard
export function AdminDashboard() {
  const [user, setUser] = useState<FullUser | null>(null);

  useEffect(() => {
    api.getMe()
      .then(res => setUser(res.user))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
        <h2 className="text-lg font-bold text-white mb-2">Welcome, {user?.name || 'Administrator'}</h2>
        <p className="text-slate-400 text-sm">Here is a quick overview of your admin status.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Admin Profile</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-500">Name:</span>
              <span className="text-slate-350 ml-2 font-medium">{user?.name}</span>
            </div>
            <div>
              <span className="text-slate-500">Email:</span>
              <span className="text-slate-350 ml-2 font-medium">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-500">Access Role:</span>
              <span className="text-indigo-400 ml-2 font-mono">{user?.role}</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Management Controls</h3>
            <p className="text-sm text-slate-400">Manage medical practitioner accounts, adjust checkup slot intervals, and record leave periods.</p>
          </div>
          <div className="mt-4 text-xs text-indigo-400 font-mono">
            System Online & Connected
          </div>
        </div>
      </div>
    </div>
  );
}
