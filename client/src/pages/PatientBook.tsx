import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { DoctorAdminInfo } from '../services/api';
import { Clock, ShieldAlert, CheckCircle2, RefreshCw, ChevronRight, ArrowLeft } from 'lucide-react';

export default function PatientBook() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const date = searchParams.get('date');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  // Core Booking States
  const [doctor, setDoctor] = useState<DoctorAdminInfo | null>(null);
  const [appointment, setAppointment] = useState<any>(null);
  
  // Status flags
  const [holding, setHolding] = useState(true);
  const [holdError, setHoldError] = useState<string | null>(null);
  
  // Timer States
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [timerExpired, setTimerExpired] = useState(false);
  const timerRef = useRef<any>(null);

  // Symptoms description
  const [symptoms, setSymptoms] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const holdTriggered = useRef(false);

  // 1. Fetch Doctor details & Hold the slot immediately on mount
  useEffect(() => {
    if (holdTriggered.current) return;
    holdTriggered.current = true;

    const initHold = async () => {
      if (!doctorId || !start || !end) {
        setHoldError('Missing required booking parameters.');
        setHolding(false);
        return;
      }

      try {
        // Fetch doctor info for display
        const docRes = await api.getDoctor(doctorId);
        setDoctor(docRes.doctor);

        // Call backend POST /api/appointments/hold
        const holdRes = await api.holdSlot({
          doctorId,
          startTime: start,
          endTime: end
        });
        
        setAppointment(holdRes.appointment);
        setHolding(false);

        // Start countdown timer based on holdExpiresAt
        const expiresAt = new Date(holdRes.appointment.holdExpiresAt).getTime();
        
        const updateTimer = () => {
          const now = Date.now();
          const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setSecondsLeft(diff);
          if (diff <= 0) {
            setTimerExpired(true);
            if (timerRef.current) clearInterval(timerRef.current);
          }
        };

        updateTimer();
        timerRef.current = setInterval(updateTimer, 1000);
      } catch (err: any) {
        console.error(err);
        setHoldError(err.message || 'Failed to establish slot hold.');
        setHolding(false);
      }
    };

    initHold();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [doctorId, start, end]);

  // 2. Submit Symptoms and Confirm appointment
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment || timerExpired) return;
    
    setConfirming(true);
    setConfirmError(null);

    try {
      await api.confirmAppointment(appointment.id, { symptoms });
      setSuccess(true);
      if (timerRef.current) clearInterval(timerRef.current);
      
      setTimeout(() => {
        navigate('/patient/appointments');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setConfirmError(err.message || 'Failed to confirm appointment.');
    } finally {
      setConfirming(false);
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    const d = new Date(timeStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };

  const formatTimerLabel = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${String(remainingSecs).padStart(2, '0')}s`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <div>
        <Link
          to={`/patient/doctors/${doctorId}`}
          className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Change date or slot selection</span>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {holding ? (
          <div className="text-center py-12 space-y-4">
            <RefreshCw className="animate-spin h-8 w-8 text-teal-600 mx-auto" />
            <p className="text-slate-500 text-xs">Locking slot hold & verifying details...</p>
          </div>
        ) : holdError ? (
          <div className="text-center py-8 space-y-4">
            <ShieldAlert className="h-12 w-12 text-rose-600 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">Booking Unavailable</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">{holdError}</p>
            <div className="pt-4">
              <Link
                to={`/patient/doctors/${doctorId}`}
                className="px-6 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-700 rounded-xl text-sm font-bold transition inline-block"
              >
                Go Back to Schedules
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Header info */}
            <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-black text-slate-900">Confirm Your Visit</h1>
                <p className="text-slate-550 text-xs mt-1">Provide symptoms to complete the checkup booking.</p>
              </div>

              {/* Hold Countdown Timer */}
              {!success && !timerExpired && (
                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-250 text-amber-700 self-start sm:self-auto shadow-sm">
                  <Clock className="h-4.5 w-4.5 animate-pulse text-amber-600" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">
                    Hold: {formatTimerLabel(secondsLeft)}
                  </span>
                </div>
              )}
            </div>

            {/* General appointment summary info */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-3.5 text-xs text-slate-650">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Practitioner</span>
                  <p className="text-slate-900 font-bold mt-1 text-sm">{doctor?.name}</p>
                  <p className="text-teal-700 text-xs font-semibold mt-0.5">{doctor?.specialization}</p>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Schedule Time</span>
                  <p className="text-slate-900 font-bold mt-1 text-sm">
                    {date ? new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : ''}
                  </p>
                  <p className="text-slate-500 font-mono text-xs mt-0.5">
                    {formatTime(start)} - {formatTime(end)} (UTC)
                  </p>
                </div>
              </div>
            </div>

            {/* Error / Success state blocks */}
            {confirmError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5">
                <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5 text-rose-600" />
                <span className="font-semibold">{confirmError}</span>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs flex items-start space-x-2.5 animate-fade-in">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <p className="font-bold">Appointment Booked Successfully!</p>
                  <p className="text-xs text-emerald-600 mt-1">Redirecting you to dashboard...</p>
                </div>
              </div>
            )}

            {timerExpired && !success && (
              <div className="p-6 rounded-xl bg-rose-50 border border-rose-100 text-center space-y-4">
                <ShieldAlert className="h-10 w-10 text-rose-600 mx-auto" />
                <h3 className="text-slate-900 font-bold">Hold Session Expired</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  The temporary hold on this slot expired. It has been released for other patients to select.
                </p>
                <div className="pt-2">
                  <Link
                    to={`/patient/doctors/${doctorId}`}
                    className="inline-flex justify-center items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Select Another Slot
                  </Link>
                </div>
              </div>
            )}

            {/* Confirmation form */}
            {!timerExpired && !success && (
              <form onSubmit={handleConfirm} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Describe your symptoms <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="block w-full px-4 py-3 bg-white border border-slate-350 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                    placeholder="Please provide details (e.g. onset, duration, pain scale, other notes)..."
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={confirming}
                    className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl border border-transparent text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm disabled:opacity-50 transition cursor-pointer"
                  >
                    {confirming ? 'Confirming Appointment...' : 'Confirm Appointment'}
                    {!confirming && <ChevronRight className="ml-1.5 h-4 w-4" />}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
