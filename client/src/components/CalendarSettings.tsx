import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Calendar, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CalendarSettings() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCalendarStatus();
      setConnected(res.connected);
      setGoogleEmail(res.googleEmail);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch calendar status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await api.getCalendarConnectUrl();
      if (res.url) {
        // Redirect browser to Google Consent screen
        window.location.href = res.url;
      } else {
        throw new Error('Connection URL was empty.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to initialize calendar connection');
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await api.disconnectCalendar();
      setConnected(false);
      setGoogleEmail(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to disconnect calendar');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center space-x-2 text-slate-400 text-xs">
        <RefreshCw className="animate-spin h-4 w-4 text-indigo-500" />
        <span>Loading calendar status...</span>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-850 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-950/50 text-indigo-400 rounded-lg">
            <Calendar className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Google Calendar Integration</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Automatically sync consultations to your primary calendar</p>
          </div>
        </div>

        {connected ? (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-950/20">
            <CheckCircle2 className="h-3 w-3" />
            <span>Connected</span>
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950 text-slate-450 border border-slate-800">
            Not Connected
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-955/35 border border-rose-900/50 text-rose-455 text-xs flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div>
          {connected ? (
            <p className="text-slate-300">
              Synced with: <span className="font-mono text-indigo-350">{googleEmail || 'Google Account'}</span>
            </p>
          ) : (
            <p className="text-slate-450">
              No calendar connected. Connect your Google Account to automatically add AegisHealth checkup slots.
            </p>
          )}
        </div>

        <div className="shrink-0">
          {connected ? (
            <button
              onClick={handleDisconnect}
              disabled={actionLoading}
              className="px-4 py-2 border border-rose-900/30 hover:border-rose-900/60 bg-rose-955/20 hover:bg-rose-955/30 text-rose-400 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              {actionLoading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={actionLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              {actionLoading ? 'Connecting...' : 'Connect Google Calendar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
