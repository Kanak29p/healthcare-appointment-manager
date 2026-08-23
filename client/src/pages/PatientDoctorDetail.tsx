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
      <div className="flex items-center justify-center p-20">
        <RefreshCw className="animate-spin h-7 w-7 text-indigo-500 mr-3" />
        <span className="text-slate-400">Loading doctor details...</span>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="space-y-4 max-w-md">
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-455 text-sm">
          {error || 'Doctor details could not be found.'}
        </div>
        <Link to="/patient/doctors" className="inline-flex items-center text-sm text-indigo-400 hover:text-white transition">
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
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to doctors directory</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Doctor profile card & working hours */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center">
            <div className="p-4 bg-indigo-950/50 text-indigo-400 rounded-2xl border border-indigo-900/20 inline-block mb-4">
              <Stethoscope className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-white leading-tight">{doctor.name}</h2>
            <span className="inline-block mt-2 px-3 py-1 bg-indigo-950 text-indigo-400 font-semibold text-xs rounded-full border border-indigo-950/20">
              {doctor.specialization}
            </span>
            
            <div className="mt-6 border-t border-slate-850 pt-6 space-y-3 text-sm text-slate-350 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-300 font-medium">{doctor.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Experience:</span>
                <span className="text-slate-300 font-medium">{doctor.experience ? `${doctor.experience} Years` : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Slot Duration:</span>
                <span className="text-slate-300 font-medium">{doctor.slotDuration} minutes</span>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-850">
              Working Hours
            </h3>
            {doctor.availabilities && doctor.availabilities.length === 0 ? (
              <p className="text-slate-500 text-xs italic">No scheduled availability details.</p>
            ) : (
              <ul className="space-y-2.5 text-sm text-slate-350">
                {doctor.availabilities?.map((avail) => (
                  <li key={avail.id} className="flex justify-between items-center py-1">
                    <span className="font-semibold text-slate-300">{avail.dayOfWeek}</span>
                    <span className="text-slate-450 font-mono text-xs">{avail.startTime} - {avail.endTime}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Date selection & slot list */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-850 pb-5 gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Consultation Slots</h3>
              <p className="text-slate-400 text-xs mt-0.5">Select a target date to explore available schedules.</p>
            </div>
            <div className="relative rounded-xl max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-550">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Slots display */}
          {slotsLoading ? (
            <div className="flex items-center justify-center p-12">
              <RefreshCw className="animate-spin h-6 w-6 text-indigo-500 mr-2" />
              <span className="text-slate-450 text-sm">Checking scheduler blocks...</span>
            </div>
          ) : slotsError ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-455 text-sm">
              {slotsError}
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm bg-slate-950/30 rounded-xl border border-slate-850 border-dashed">
              <Clock className="h-8 w-8 text-slate-600 mx-auto mb-3" />
              <p className="font-semibold text-slate-400">Doctor unavailable on this date</p>
              <p className="text-xs text-slate-500 mt-1">Leaves schedule or off-duty periods apply. Please select another date.</p>
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
                        ? 'bg-slate-950 border-slate-850 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 cursor-pointer'
                        : isHeld
                        ? 'bg-amber-950/15 border-amber-900/40 text-amber-500 cursor-not-allowed opacity-80'
                        : 'bg-slate-900/50 border-slate-850 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1 font-mono">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatTimeStr(slot.startTime)}</span>
                    </div>

                    <div className="mt-2 text-[10px] font-extrabold uppercase tracking-wider">
                      {isAvail && (
                        <span className="text-indigo-400 inline-flex items-center">
                          Book Slot <ChevronRight className="h-3 w-3 ml-0.5" />
                        </span>
                      )}
                      {isHeld && <span className="text-amber-500">Temporarily Held</span>}
                      {isBooked && (
                        <span className="text-slate-655 inline-flex items-center">
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
