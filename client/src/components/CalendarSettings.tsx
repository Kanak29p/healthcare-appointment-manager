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
      <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-center space-x-2 text-slate-500 text-xs shadow-sm">
        <RefreshCw className="animate-spin h-4 w-4 text-teal-600" />
        <span>Loading calendar status...</span>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
            <Calendar className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Google Calendar Sync</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Automatically sync AegisHealth consultations to your calendar</p>
          </div>
        </div>

        {connected ? (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-250">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Connected</span>
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200">
            Not Connected
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div>
          {connected ? (
            <p className="text-slate-650">
              Synced with: <span className="font-semibold text-teal-700">{googleEmail || 'Google Account'}</span>
            </p>
          ) : (
            <p className="text-slate-500 leading-relaxed">
              No calendar connected. Connect your Google Account to automatically sync AegisHealth slots.
            </p>
          )}
        </div>

        <div className="shrink-0">
          {connected ? (
            <button
              onClick={handleDisconnect}
              disabled={actionLoading}
              className="px-4 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-650 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              {actionLoading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={actionLoading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              {actionLoading ? 'Connecting...' : 'Connect Google Calendar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
