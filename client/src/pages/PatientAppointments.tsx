import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { PatientAppointmentInfo, Slot } from '../services/api';
import { CalendarDays, RefreshCw, XCircle, Stethoscope, Clock } from 'lucide-react';
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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Appointments</h1>
        <p className="text-slate-500 text-xs mt-1">Manage and track your schedule, reschedules, and checkup summaries.</p>
      </div>

      <CalendarSettings />

      {loading ? (
        <div className="flex items-center justify-center p-20 bg-white border border-slate-150 rounded-2xl">
          <RefreshCw className="animate-spin h-6 w-6 text-teal-600 mr-2" />
          <span className="text-slate-500 text-xs">Fetching your bookings list...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-750 text-xs font-semibold">
          {error}
        </div>
      ) : appointments.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold">
          <CalendarDays className="h-10 w-10 text-slate-350 mx-auto mb-4" />
          <p className="font-bold text-slate-900 text-sm">No Appointments Found</p>
          <p className="text-slate-450 mt-1">Search for a practitioner to schedule your first consultation.</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* 1. Upcoming Appointments */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-200">
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
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-3.5 mb-3 border-b border-slate-100 pb-3">
                          <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                            <Stethoscope className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{appt.doctorName}</h4>
                            <p className="text-teal-700 text-xs font-semibold mt-0.5">{appt.specialization}</p>
                          </div>
                        </div>

                        <div className="mt-3.5 space-y-2 text-xs text-slate-650">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-550">Date & Time:</span>
                            <span className="font-bold text-slate-800">
                              {new Date(appt.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} | {formatTimeShort(appt.startTime)} - {formatTimeShort(appt.endTime)} (UTC)
                            </span>
                          </div>
                          {appt.symptoms && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                              <span className="text-slate-500 block mb-1 font-bold text-[10px] uppercase tracking-wider">Symptoms Description:</span>
                              <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs leading-normal">
                                "{appt.symptoms}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rescheduling Form Drawer (Inline Accordion) */}
                      {isEditing && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-fade-in">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Reschedule Date:</span>
                            <input
                              type="date"
                              value={rescheduleDate}
                              onChange={(e) => handleRescheduleDateChange(appt.doctorId || '', e.target.value)}
                              className="px-3 py-2 bg-white border border-slate-350 rounded-xl text-slate-800 text-xs focus:ring-teal-500"
                            />
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => fetchRescheduleSlots(appt.doctorId || '', rescheduleDate)}
                              className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            >
                              Check Slots
                            </button>
                          </div>

                          {slotsLoading ? (
                            <div className="text-center text-xs text-slate-500 py-2 flex items-center justify-center space-x-1.5">
                              <RefreshCw className="animate-spin h-3.5 w-3.5 text-teal-600" />
                              <span>Checking schedules...</span>
                            </div>
                          ) : slotsError ? (
                            <div className="text-xs text-rose-700 font-semibold">{slotsError}</div>
                          ) : slots.length === 0 ? (
                            <div className="text-xs text-slate-500 italic py-2">No available times found. Try another date.</div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              {slots.filter(s => s.status === 'AVAILABLE').map((slot, sIdx) => {
                                const isSel = selectedSlot?.startTime === slot.startTime;
                                return (
                                  <button
                                    key={sIdx}
                                    type="button"
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`px-2 py-1.5 rounded-lg border text-center font-mono text-[10px] font-bold transition ${
                                      isSel 
                                        ? 'bg-teal-650 border-teal-500 text-white shadow-sm' 
                                        : 'bg-white border-slate-250 text-slate-650 hover:border-teal-500 hover:bg-teal-50/10'
                                    }`}
                                  >
                                    {formatTimeStr(slot.startTime)}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-150">
                            <button
                              type="button"
                              onClick={() => setReschedulingId(null)}
                              className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={!selectedSlot || savingReschedule}
                              onClick={() => handleConfirmReschedule(appt.id)}
                              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white rounded-lg disabled:opacity-50"
                            >
                              {savingReschedule ? 'Saving...' : 'Save Reschedule'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      {!isEditing && (
                        <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end space-x-3">
                          <button
                            onClick={() => handleCancel(appt.id)}
                            className="px-4 py-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleStartReschedule(appt)}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
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
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-200">
              Completed Visits
            </h3>
            {pastAppts.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-2">No historical consultations recorded.</p>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-150">
                  {pastAppts.map((appt) => (
                    <div key={appt.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{appt.doctorName}</span>
                        <p className="text-teal-700 text-xs font-semibold mt-0.5">{appt.specialization}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right text-xs font-mono text-slate-500 flex items-center space-x-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{new Date(appt.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} | {formatTimeShort(appt.startTime)} (UTC)</span>
                        </div>
                        {appt.status === 'COMPLETED' && (
                          <Link
                            to={`/patient/appointments/${appt.id}/summary`}
                            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-750 text-white rounded-xl text-xs font-bold shadow-sm transition"
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
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-200">
              Cancelled Visits
            </h3>
            {cancelledAppts.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-2">No cancelled appointments recorded.</p>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden opacity-70">
                <div className="divide-y divide-slate-100">
                  {cancelledAppts.map((appt) => (
                    <div key={appt.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <span className="font-semibold text-slate-500 text-sm line-through">{appt.doctorName}</span>
                        <p className="text-slate-450 text-xs mt-0.5">{appt.specialization}</p>
                      </div>
                      <div className="text-right text-xs font-mono text-slate-500 flex items-center space-x-1.5">
                        <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
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
