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
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Change date or slot selection</span>
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {holding ? (
          <div className="text-center py-12 space-y-4">
            <RefreshCw className="animate-spin h-8 w-8 text-indigo-500 mx-auto" />
            <p className="text-slate-400 text-sm">Locking slot hold & verifying details...</p>
          </div>
        ) : holdError ? (
          <div className="text-center py-8 space-y-4">
            <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-white">Booking Unavailable</h2>
            <p className="text-sm text-slate-450 max-w-md mx-auto">{holdError}</p>
            <div className="pt-4">
              <Link
                to={`/patient/doctors/${doctorId}`}
                className="px-6 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-350 hover:text-white rounded-xl text-sm font-semibold transition"
              >
                Go Back to Schedules
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Header info */}
            <div className="border-b border-slate-850 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white">Confirm Your Visit</h1>
                <p className="text-slate-400 text-xs mt-1">Provide symptoms to complete the checkup booking.</p>
              </div>

              {/* Hold Countdown Timer */}
              {!success && !timerExpired && (
                <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-xl bg-amber-955/10 border border-amber-900/40 text-amber-500 self-start sm:self-auto shadow-sm">
                  <Clock className="h-4.5 w-4.5 animate-pulse text-amber-500" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">
                    Hold: {formatTimerLabel(secondsLeft)}
                  </span>
                </div>
              )}
            </div>

            {/* General appointment summary info */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850 space-y-3.5 text-sm text-slate-350">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 block text-xs font-semibold uppercase tracking-wider">Practitioner</span>
                  <p className="text-white font-medium mt-1">{doctor?.name}</p>
                  <p className="text-indigo-400 text-xs mt-0.5">{doctor?.specialization}</p>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs font-semibold uppercase tracking-wider">Schedule Time</span>
                  <p className="text-white font-medium mt-1">
                    {date ? new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : ''}
                  </p>
                  <p className="text-slate-450 font-mono text-xs mt-0.5">
                    {formatTime(start)} - {formatTime(end)} (UTC)
                  </p>
                </div>
              </div>
            </div>

            {/* Error / Success state blocks */}
            {confirmError && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-455 text-sm flex items-start space-x-2.5">
                <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5 text-rose-500" />
                <span className="font-medium">{confirmError}</span>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-sm flex items-start space-x-2.5 animate-fade-in">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-emerald-555" />
                <div>
                  <p className="font-semibold">Appointment Booked Successfully!</p>
                  <p className="text-xs text-emerald-500 mt-1">Redirecting you to dashboard...</p>
                </div>
              </div>
            )}

            {timerExpired && !success && (
              <div className="p-6 rounded-xl bg-rose-950/20 border border-rose-900/40 text-center space-y-4">
                <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto" />
                <h3 className="text-white font-bold">Hold Session Expired</h3>
                <p className="text-xs text-slate-455 max-w-sm mx-auto">
                  The temporary hold on this slot expired. It has been released for other patients to select.
                </p>
                <div className="pt-2">
                  <Link
                    to={`/patient/doctors/${doctorId}`}
                    className="inline-flex justify-center items-center px-4 py-2 bg-indigo-650 hover:bg-indigo-550 text-white rounded-xl text-xs font-semibold transition"
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
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    Describe your symptoms
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="block w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Describe your symptoms here (e.g. persistent headaches, joint soreness for the last 3 days)..."
                  />
                  <p className="text-xs text-amber-500 font-medium mt-1.5">
                    Your symptoms will be shared with the doctor and used to prepare a pre-visit summary.
                  </p>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-855 space-x-3">
                  <Link
                    to={`/patient/doctors/${doctorId}`}
                    className="px-6 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-450 hover:text-white rounded-xl text-sm font-semibold transition"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={confirming || symptoms.length < 5}
                    className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-650 hover:bg-indigo-550 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {confirming ? 'Booking...' : 'Confirm Appointment'}
                    {!confirming && <ChevronRight className="h-4 w-4" />}
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
