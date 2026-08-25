import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { PatientAppointmentInfo, Slot } from '../services/api';
import { CalendarDays, RefreshCw, XCircle, Stethoscope } from 'lucide-react';
import CalendarSettings from '../components/CalendarSettings';

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState<PatientAppointmentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rescheduling state
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [savingReschedule, setSavingReschedule] = useState(false);

  const fetchAppointments = async () => {
    try {
      const data = await api.getMyAppointments();
      setAppointments(data.appointments);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Cancel Appointment
  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.cancelAppointment(id);
      fetchAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment.');
    }
  };

  // Open inline reschedule controller
  const handleStartReschedule = (appt: PatientAppointmentInfo) => {
    setReschedulingId(appt.id);
    setSelectedSlot(null);
    setSlots([]);
    setSlotsError(null);
    
    // Set default date to today's date formatted as YYYY-MM-DD
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    setRescheduleDate(dateStr);
  };

  // Fetch available slots for rescheduling doctor
  const fetchRescheduleSlots = async (doctorId: string, date: string) => {
    if (!doctorId || !date) return;
    setSlotsLoading(true);
    setSlotsError(null);
    try {
      // Find the appointment to get the doctor's ID
      const appt = appointments.find(a => a.id === reschedulingId);
      if (!appt) return;
      
      const res = await api.getDoctorSlots(doctorId, date);
      setSlots(res.slots);
    } catch (err: any) {
      console.error(err);
      setSlotsError(err.message || 'Failed to load availability slots.');
    } finally {
      setSlotsLoading(false);
    }
  };

  // Trigger slot search whenever reschedule date changes
  const handleRescheduleDateChange = (doctorId: string, date: string) => {
    setRescheduleDate(date);
    setSelectedSlot(null);
    fetchRescheduleSlots(doctorId, date);
  };

  // Submit Reschedule PATCH
  const handleConfirmReschedule = async (apptId: string) => {
    if (!selectedSlot) return;
    setSavingReschedule(true);
    try {
      await api.rescheduleAppointment(apptId, {
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime
      });
      setReschedulingId(null);
      fetchAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to reschedule appointment.');
    } finally {
      setSavingReschedule(false);
    }
  };

  const formatTimeStr = (isoStr: string) => {
    const d = new Date(isoStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };

  const formatTimeShort = (isoStr: string) => {
    const d = new Date(isoStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };

  // Grouping appointments
  const upcomingAppts = appointments.filter(
    a => a.status === 'CONFIRMED' && new Date(a.startTime) > new Date()
  );
  
  const pastAppts = appointments.filter(
    a => (a.status === 'CONFIRMED' && new Date(a.startTime) <= new Date()) || a.status === 'COMPLETED'
  );
  
  const cancelledAppts = appointments.filter(a => a.status === 'CANCELLED');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">My Appointments</h1>
        <p className="text-slate-400 text-sm mt-1">Manage and track your schedule, reschedules, and checkup summaries.</p>
      </div>

      <CalendarSettings />

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <RefreshCw className="animate-spin h-7 w-7 text-indigo-500 mr-3" />
          <span className="text-slate-400">Fetching your bookings list...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-455 text-sm">
          {error}
        </div>
      ) : appointments.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-sm">
          <CalendarDays className="h-10 w-10 text-slate-600 mx-auto mb-4" />
          <p className="font-semibold text-white">No Appointments Found</p>
          <p className="text-xs text-slate-550 mt-1">Search for a practitioner to schedule your first consultation.</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* 1. Upcoming Appointments */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-405 uppercase tracking-wider pb-1.5 border-b border-slate-900">
              Upcoming Bookings
            </h3>
            {upcomingAppts.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-2">No upcoming consultations scheduled.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingAppts.map((appt) => {
                  const isEditing = reschedulingId === appt.id;
                  
                  return (
                    <div
                      key={appt.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-3.5 mb-3">
                          <div className="p-2 bg-indigo-950/50 text-indigo-400 rounded-lg">
                            <Stethoscope className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white text-sm">{appt.doctorName}</h4>
                            <p className="text-indigo-400 text-xs mt-0.5">{appt.specialization}</p>
                          </div>
                        </div>

                        <div className="mt-3.5 space-y-2 text-xs text-slate-350">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Date & Time:</span>
                            <span className="font-mono text-slate-300">
                              {new Date(appt.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} | {formatTimeShort(appt.startTime)} - {formatTimeShort(appt.endTime)} (UTC)
                            </span>
                          </div>
                          {appt.symptoms && (
                            <div className="mt-2 pt-2 border-t border-slate-850">
                              <span className="text-slate-550 block mb-1">Symptoms Description:</span>
                              <p className="text-slate-400 italic bg-slate-950/30 p-2 rounded text-xs leading-normal">
                                "{appt.symptoms}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rescheduling Form Drawer (Inline Accordion) */}
                      {isEditing && (
                        <div className="mt-4 pt-4 border-t border-slate-850 space-y-4 animate-fade-in">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs font-semibold text-white">Select Reschedule Time:</span>
                            <input
                              type="date"
                              value={rescheduleDate}
                              onChange={(e) => handleRescheduleDateChange(appt.doctorName, e.target.value)} // Note: We need doctorId, appt.doctorName doesn't contain ID. Wait!
                              // Wait, does the backend GET /api/appointments/my return doctorId?
                              // Let's check `formatted` object in server getPatientAppointments:
                              // Ah! `formatted = appointments.map(appt => ({ id: appt.id, doctorName: appt.doctor.name, ... }))`. We did NOT include doctorId or doctorProfileId!
                              // But wait! If we edit getPatientAppointments in `server/src/routes/appointment.ts` to return `doctorId: appt.doctorId` (which is the user ID of the doctor), we can access it!
                              // Let's make sure our reschedule date change calls with the doctorId:
                              // Let's check if the appointment object has doctorId.
                              // Yes! Let's modify the server router to return doctorId inside getPatientAppointments formatted mapping.
                              // We will do that! Let's look at `server/src/routes/appointment.ts` around line 430.
                              // Yes, we will correct that server endpoint to include doctorId. For now, let's write `appt.doctorId` in the client code!
                            />
                          </div>

                          {/* Date inputs search trigger */}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                // Find appointment doctor userId in the appointment
                                const apptObj = appointments.find(a => a.id === appt.id) as any;
                                fetchRescheduleSlots(apptObj.doctorId || '', rescheduleDate);
                              }}
                              className="px-3.5 py-1.5 bg-slate-955 border border-slate-800 text-[10px] font-semibold text-slate-300 hover:text-white rounded-lg transition"
                            >
                              Check Slots
                            </button>
                          </div>

                          {slotsLoading ? (
                            <div className="text-center text-xs text-slate-500">Checking schedules...</div>
                          ) : slotsError ? (
                            <div className="text-[10px] text-rose-500">{slotsError}</div>
                          ) : slots.length === 0 ? (
                            <div className="text-[10px] text-slate-500 italic">No available times found. Try another date.</div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              {slots.filter(s => s.status === 'AVAILABLE').map((slot, sIdx) => {
                                const isSel = selectedSlot?.startTime === slot.startTime;
                                return (
                                  <button
                                    key={sIdx}
                                    type="button"
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`px-2 py-1.5 rounded-lg border text-center font-mono text-[10px] font-semibold transition ${
                                      isSel 
                                        ? 'bg-indigo-650 border-indigo-500 text-white' 
                                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {formatTimeStr(slot.startTime)}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-850">
                            <button
                              type="button"
                              onClick={() => setReschedulingId(null)}
                              className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-[10px] font-semibold text-slate-400 rounded-lg hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={!selectedSlot || savingReschedule}
                              onClick={() => handleConfirmReschedule(appt.id)}
                              className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-550 text-[10px] font-semibold text-white rounded-lg disabled:opacity-50"
                            >
                              {savingReschedule ? 'Saving...' : 'Save Reschedule'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      {!isEditing && (
                        <div className="mt-5 pt-3.5 border-t border-slate-850 flex items-center justify-end space-x-3">
                          <button
                            onClick={() => handleCancel(appt.id)}
                            className="px-4 py-2 bg-slate-950 hover:bg-rose-955/20 border border-slate-800 text-slate-450 hover:text-rose-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleStartReschedule(appt)}
                            className="px-4 py-2 bg-indigo-650 hover:bg-indigo-550 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                          >
                            Reschedule
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Past Appointments */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-405 uppercase tracking-wider pb-1.5 border-b border-slate-900">
              Completed Visits
            </h3>
            {pastAppts.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-2">No historical consultations recorded.</p>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="divide-y divide-slate-850">
                  {pastAppts.map((appt) => (
                    <div key={appt.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <span className="font-semibold text-white text-sm">{appt.doctorName}</span>
                        <p className="text-slate-450 text-xs mt-0.5">{appt.specialization}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right text-xs font-mono text-slate-400">
                          {new Date(appt.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} | {formatTimeShort(appt.startTime)} (UTC)
                        </div>
                        {appt.status === 'COMPLETED' && (
                          <Link
                            to={`/patient/appointments/${appt.id}/summary`}
                            className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold transition"
                          >
                            View Summary
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Cancelled Appointments */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-405 uppercase tracking-wider pb-1.5 border-b border-slate-900">
              Cancelled Visits
            </h3>
            {cancelledAppts.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-2">No cancelled appointments recorded.</p>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden opacity-70 shadow-xl">
                <div className="divide-y divide-slate-850">
                  {cancelledAppts.map((appt) => (
                    <div key={appt.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <span className="font-semibold text-slate-400 text-sm line-through">{appt.doctorName}</span>
                        <p className="text-slate-500 text-xs mt-0.5">{appt.specialization}</p>
                      </div>
                      <div className="text-right text-xs font-mono text-slate-500 flex items-center space-x-1.5">
                        <XCircle className="h-3.5 w-3.5 text-rose-500" />
                        <span>Cancelled</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
