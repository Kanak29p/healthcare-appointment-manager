import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { FullUser } from '../services/api';
import { Activity, LogOut, User as UserIcon, RefreshCw, AlertCircle, Calendar, ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import CalendarSettings from '../components/CalendarSettings';

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
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center font-sans">
        <RefreshCw className="animate-spin h-8 w-8 text-teal-600 mb-4" />
        <p className="text-slate-500 text-sm">Verifying session details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full p-6 bg-white border border-slate-200 rounded-2xl text-center shadow-sm">
          <AlertCircle className="h-12 w-12 text-rose-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Authentication Error</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 font-bold text-white rounded-xl transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-600 rounded-xl text-white">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-900">
              AegisHealth
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${roleBg} ${roleText} border border-teal-100`}>
              {roleIcon}
              <span className="ml-1.5">{user?.role}</span>
            </span>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-150 pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
              <p className="text-slate-500 mt-1 text-sm">Welcome back, {user?.name}</p>
            </div>
            <div className="mt-4 sm:mt-0 text-xs text-slate-400 font-mono">
              User ID: {user?.id}
            </div>
          </div>

          {/* Render Page Contents */}
          {user && children(user)}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>© AegisHealth. Dashboard Portal. Secured session.</p>
      </footer>
    </div>
  );
}

// 1. Patient Dashboard (Redirection default fallback details)
export function PatientDashboard() {
  return (
    <DashboardFrame
      title="Patient Dashboard"
      roleIcon={<UserIcon className="h-3.5 w-3.5" />}
      roleBg="bg-teal-50"
      roleText="text-teal-700"
    >
      {(user: FullUser) => (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Patient Profile Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-semibold">Full Name:</span>
                <p className="text-slate-800 font-bold mt-0.5">{user.name}</p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Email Address:</span>
                <p className="text-slate-800 font-bold mt-0.5">{user.email}</p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Phone Number:</span>
                <p className="text-slate-800 font-bold mt-0.5">{user.patientProfile?.phone || 'Not Provided'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Gender:</span>
                <p className="text-slate-800 font-bold mt-0.5">{user.patientProfile?.gender || 'Not Specified'}</p>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <span className="text-slate-500 font-semibold">Date of Birth:</span>
                <p className="text-slate-800 font-bold mt-0.5">
                  {user.patientProfile?.dateOfBirth 
                    ? new Date(user.patientProfile.dateOfBirth).toLocaleDateString() 
                    : 'Not Specified'}
                </p>
              </div>
            </div>
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

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const res = await api.doctorGetAppointments();
        setAppointments(res.appointments || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to fetch checkups schedule');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const formatTimeStr = (dateStr: string) => {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };

  return (
    <DashboardFrame
      title="Doctor Portal"
      roleIcon={<Activity className="h-3.5 w-3.5" />}
      roleBg="bg-teal-50"
      roleText="text-teal-700"
    >
      {(user: FullUser) => (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Overview Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-150">
                Practitioner Profile
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Practice Type:</span>
                  <span className="font-bold text-slate-800">{user.doctorProfile?.specialization}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Slots:</span>
                  <span className="font-semibold text-slate-800">{user.doctorProfile?.slotDuration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Practice Status:</span>
                  <span className="inline-flex items-center text-teal-700 font-bold">
                    Active Duty
                  </span>
                </div>
              </div>
            </div>

            {/* Google Calendar Link Card */}
            <div className="md:col-span-2">
              <CalendarSettings />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900">My Consultations Schedule</h1>
              <p className="text-slate-500 text-xs mt-1">Review upcoming appointments, record prescriptions, and check patient logs.</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-20 bg-white border border-slate-150 rounded-2xl">
                <RefreshCw className="animate-spin h-6 w-6 text-teal-600 mr-2" />
                <span className="text-slate-500 text-xs">Loading schedules...</span>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-slate-50 border border-slate-200">
                <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-xs font-semibold">No appointments scheduled on your roster yet.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* 1. Pending/Confirmed Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-200">
                    Active Appointments
                  </h3>
                  {appointments.filter(a => a.status === 'CONFIRMED').length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">No active pending consults scheduled.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {appointments.filter(a => a.status === 'CONFIRMED').map((appt) => (
                        <div
                          key={appt.id}
                          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{appt.patientName}</h4>
                                <p className="text-slate-500 text-xs mt-0.5">{appt.patientEmail}</p>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                {appt.status}
                              </span>
                            </div>

                            <div className="mt-4 space-y-2.5 text-xs text-slate-650">
                              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <span className="text-slate-500 font-semibold">Schedule Time (UTC):</span>
                                <span className="font-mono text-slate-700 font-bold">
                                  {new Date(appt.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} | {formatTimeStr(appt.startTime)} - {formatTimeStr(appt.endTime)}
                                </span>
                              </div>
                              {appt.symptoms && (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                  <span className="text-slate-500 block mb-1 font-bold text-[10px] uppercase tracking-wider">Patient Symptoms:</span>
                                  <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs leading-normal">
                                    "{appt.symptoms}"
                                  </p>
                                </div>
                              )}

                              {appt.aiSummary && (
                                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                                  <span className="text-teal-700 block text-[10px] font-bold uppercase tracking-wider">
                                    AI Pre-Visit Assessment
                                  </span>
                                  {appt.aiSummary.status === 'SUCCESS' ? (
                                    <div className="space-y-2.5 text-xs">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-slate-500 font-semibold">Urgency Level:</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          appt.aiSummary.urgency === 'HIGH' 
                                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                            : appt.aiSummary.urgency === 'MEDIUM'
                                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        }`}>
                                          {appt.aiSummary.urgency}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 font-semibold block mb-0.5">Chief Complaint:</span>
                                        <p className="text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                                          {appt.aiSummary.chiefComplaint}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 font-semibold block mb-1">Suggested Consultation Questions:</span>
                                        <ol className="list-decimal list-inside space-y-1 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                          {appt.aiSummary.suggestedQuestions?.map((q: string, i: number) => (
                                            <li key={i} className="leading-normal">{q}</li>
                                          ))}
                                        </ol>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-rose-700 text-xs italic bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                                      AI pre-visit summary is temporarily unavailable.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {appt.status === 'CONFIRMED' && (
                            <div className="mt-4 pt-3 border-t border-slate-150 flex justify-end">
                              <button
                                onClick={() => navigate(`/doctor/appointments/${appt.id}`)}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                              >
                                Open Consultation
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Completed Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-200">
                    Completed Consultations
                  </h3>
                  {appointments.filter(a => a.status === 'COMPLETED').length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">No completed consultations on record.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {appointments.filter(a => a.status === 'COMPLETED').map((appt) => (
                        <div
                          key={appt.id}
                          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between opacity-90 hover:opacity-100 transition-opacity"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-bold text-slate-800 text-sm">{appt.patientName}</h4>
                                <p className="text-slate-500 text-xs mt-0.5">{appt.patientEmail}</p>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                {appt.status}
                              </span>
                            </div>

                            <div className="mt-4 space-y-2 text-xs text-slate-650">
                              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <span className="text-slate-500 font-semibold">Completed:</span>
                                <span className="font-mono text-slate-700 font-bold">
                                  {new Date(appt.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} | {formatTimeStr(appt.startTime)} - {formatTimeStr(appt.endTime)}
                                </span>
                              </div>
                              {appt.symptoms && (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                  <span className="text-slate-500 block mb-1 font-bold text-[10px] uppercase tracking-wider">Patient Symptoms:</span>
                                  <p className="text-slate-650 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs leading-normal">
                                    "{appt.symptoms}"
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-150 flex justify-end">
                            <button
                              onClick={() => navigate(`/doctor/appointments/${appt.id}`)}
                              className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              View Consultation
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardFrame>
  );
}

// 3. Admin Dashboard
export function AdminDashboard() {
  const [user, setUser] = useState<FullUser | null>(null);
  const [failedJobs, setFailedJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [redisWarning, setRedisWarning] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      setJobsError(null);
      const res = await api.adminGetFailedJobs();
      setFailedJobs(res.jobs || []);
      setRedisWarning(res.warning);
    } catch (err: any) {
      console.error(err);
      setJobsError(err.message || 'Failed to retrieve background jobs log');
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    api.getMe()
      .then(res => setUser(res.user))
      .catch(console.error);
    fetchJobs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
        <h2 className="text-lg font-black text-slate-900">Welcome, {user?.name || 'Administrator'}</h2>
        <p className="text-slate-500 text-xs mt-1">System operational console overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
            Admin Profile
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Name:</span>
              <span className="font-bold text-slate-800">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-semibold text-slate-800">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Access Role:</span>
              <span className="text-teal-700 font-mono font-bold">{user?.role}</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
              Management Controls
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Manage medical practitioner accounts, adjust checkup slot intervals, and record leave periods.
            </p>
          </div>
          <div className="mt-4 text-[10px] text-teal-600 font-mono font-bold uppercase tracking-wider">
            System Online & Connected
          </div>
        </div>
      </div>

      {/* Failed Jobs Monitoring Panel */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Background Queues & Failed Jobs</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Real-time status of email reminders and medication worker queues</p>
            </div>
          </div>

          <button
            onClick={fetchJobs}
            disabled={loadingJobs}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loadingJobs ? 'animate-spin text-teal-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {redisWarning && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start space-x-2.5">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-bold">Redis Connection Offline:</span>
              <p className="mt-0.5 text-slate-650 text-[11px] leading-relaxed">{redisWarning}</p>
            </div>
          </div>
        )}

        {jobsError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {jobsError}
          </div>
        )}

        {!loadingJobs && !jobsError && (
          <>
            {failedJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
                <p className="text-sm font-bold text-slate-900">System Queues Healthy</p>
                <p className="text-xs text-slate-450">No failed background worker jobs are currently recorded in the queue.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-400">
                      <th className="py-2.5 font-bold uppercase tracking-wider text-[10px]">Job Type</th>
                      <th className="py-2.5 font-bold uppercase tracking-wider text-[10px]">Job ID</th>
                      <th className="py-2.5 font-bold uppercase tracking-wider text-[10px]">Failure Time</th>
                      <th className="py-2.5 font-bold uppercase tracking-wider text-[10px] text-center">Attempts</th>
                      <th className="py-2.5 font-bold uppercase tracking-wider text-[10px] text-right">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {failedJobs.map((job) => (
                      <tr key={job.jobId} className="hover:bg-slate-50/50 text-slate-700">
                        <td className="py-3 font-semibold">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            job.jobType.includes('Email') 
                              ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                              : 'bg-violet-50 text-violet-700 border border-violet-200'
                          }`}>
                            {job.jobType}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-[11px] text-slate-500">{job.jobId}</td>
                        <td className="py-3 text-slate-500">
                          {new Date(job.failedTimestamp).toLocaleString()}
                        </td>
                        <td className="py-3 text-center font-bold text-slate-500">{job.retryCount}</td>
                        <td className="py-3 text-right text-slate-500 italic max-w-xs truncate" title={job.safeErrorMessage}>
                          {job.safeErrorMessage}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
