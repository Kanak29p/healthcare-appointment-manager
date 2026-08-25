import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { DoctorAdminInfo, Slot } from '../services/api';
import { Stethoscope, Calendar, Clock, ArrowLeft, RefreshCw, ChevronRight, Lock } from 'lucide-react';

export default function PatientDoctorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<DoctorAdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Slots search states
  const getTodayString = () => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const fetchDoctor = async () => {
    if (!id) return;
    try {
      const res = await api.getDoctor(id);
      setDoctor(res.doctor);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to retrieve doctor details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    if (!id || !selectedDate) return;
    setSlotsLoading(true);
    setSlotsError(null);
    try {
      const res = await api.getDoctorSlots(id, selectedDate);
      setSlots(res.slots);
    } catch (err: any) {
      console.error(err);
      setSlotsError(err.message || 'Failed to retrieve slot availability.');
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctor();
  }, [id]);

  useEffect(() => {
    fetchSlots();
  }, [id, selectedDate]);

  const handleSelectSlot = (slot: Slot) => {
    if (slot.status !== 'AVAILABLE') return;
    // Redirect to the booking page with the pre-selected slot info
    navigate(
      `/patient/book/${id}?date=${selectedDate}&start=${encodeURIComponent(
        slot.startTime
      )}&end=${encodeURIComponent(slot.endTime)}`
    );
  };

  const formatTimeStr = (isoStr: string) => {
    const d = new Date(isoStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 bg-white border border-slate-150 rounded-2xl">
        <RefreshCw className="animate-spin h-6 w-6 text-teal-600 mr-2" />
        <span className="text-slate-500 text-xs">Loading doctor details...</span>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="space-y-4 max-w-md">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error || 'Doctor details could not be found.'}
        </div>
        <Link to="/patient/doctors" className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700 transition">
          ← Return to Find Doctor
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back navigation */}
      <div>
        <Link
          to="/patient/doctors"
          className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to doctors directory</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Doctor profile card & working hours */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center">
            <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100 inline-block mb-4">
              <Stethoscope className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">{doctor.name}</h2>
            <span className="inline-block mt-2 px-3 py-1 bg-teal-50 text-teal-750 font-bold text-xs rounded-full border border-teal-100">
              {doctor.specialization}
            </span>
            
            <div className="mt-6 border-t border-slate-100 pt-6 space-y-3 text-xs text-slate-650 text-left">
              <div className="flex justify-between">
                <span className="text-slate-550">Email:</span>
                <span className="text-slate-800 font-semibold">{doctor.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-550">Experience:</span>
                <span className="text-slate-800 font-bold">{doctor.experience ? `${doctor.experience} Years` : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-550">Slot Duration:</span>
                <span className="text-slate-800 font-semibold">{doctor.slotDuration} minutes</span>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              Working Hours
            </h3>
            {doctor.availabilities && doctor.availabilities.length === 0 ? (
              <p className="text-slate-500 text-xs italic">No scheduled availability details.</p>
            ) : (
              <ul className="space-y-2.5 text-xs text-slate-650">
                {doctor.availabilities?.map((avail) => (
                  <li key={avail.id} className="flex justify-between items-center py-1">
                    <span className="font-bold text-slate-700">{avail.dayOfWeek}</span>
                    <span className="text-slate-500 font-mono text-xs">{avail.startTime} - {avail.endTime}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Date selection & slot list */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Consultation Slots</h3>
              <p className="text-slate-500 text-xs mt-0.5">Select a target date to explore available schedules.</p>
            </div>
            <div className="relative rounded-xl max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 bg-white border border-slate-350 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          </div>

          {/* Slots display */}
          {slotsLoading ? (
            <div className="flex items-center justify-center p-12 bg-white">
              <RefreshCw className="animate-spin h-6 w-6 text-teal-600 mr-2" />
              <span className="text-slate-500 text-xs">Checking scheduler blocks...</span>
            </div>
          ) : slotsError ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {slotsError}
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
              <Clock className="h-8 w-8 text-slate-350 mx-auto mb-3" />
              <p className="font-bold text-slate-700">Doctor unavailable on this date</p>
              <p className="text-slate-450 mt-1">Leaves schedule or off-duty periods apply. Please select another date.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {slots.map((slot, index) => {
                const isAvail = slot.status === 'AVAILABLE';
                const isHeld = slot.status === 'HELD';
                const isBooked = slot.status === 'BOOKED';

                return (
                  <button
                    key={index}
                    disabled={!isAvail}
                    onClick={() => handleSelectSlot(slot)}
                    className={`flex flex-col items-center justify-between p-4 rounded-xl border text-center transition-all ${
                      isAvail
                        ? 'bg-white border-slate-200 hover:border-teal-500 hover:bg-teal-50/10 cursor-pointer shadow-sm'
                        : isHeld
                        ? 'bg-amber-50 border-amber-200 text-amber-700 cursor-not-allowed opacity-90'
                        : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1 font-mono">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formatTimeStr(slot.startTime)}</span>
                    </div>

                    <div className="mt-2 text-[10px] font-bold uppercase tracking-wider">
                      {isAvail && (
                        <span className="text-teal-600 inline-flex items-center font-bold">
                          Book Slot <ChevronRight className="h-3 w-3 ml-0.5" />
                        </span>
                      )}
                      {isHeld && <span className="text-amber-700 font-bold">Held</span>}
                      {isBooked && (
                        <span className="text-slate-400 inline-flex items-center">
                          <Lock className="h-3 w-3 mr-0.5" /> Booked
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
