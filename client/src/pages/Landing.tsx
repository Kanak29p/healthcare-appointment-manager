import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { HealthResponse } from '../services/api';
import { Calendar, Clock, Shield, Activity, Heart, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Landing() {
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkBackendHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.checkHealth();
      setHealthStatus(data);
    } catch (err) {
      console.error(err);
      setError('Cannot connect to healthcare server API');
      setHealthStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 group">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <Activity className="h-6 w-6 animate-pulse" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-400 bg-clip-text text-transparent tracking-tight">
              AegisHealth
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
            <a href="#about" className="hover:text-white transition-colors duration-200">About</a>
            <a href="#contact" className="hover:text-white transition-colors duration-200">Contact Support</a>
          </nav>

          <div className="flex items-center space-x-4">
            {/* Health Badge */}
            <div className="flex items-center">
              {loading ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-900 text-slate-400 border border-slate-800">
                  <RefreshCw className="animate-spin h-3.5 w-3.5 mr-1.5" />
                  Connecting API...
                </span>
              ) : error ? (
                <button
                  onClick={checkBackendHealth}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-950/50 text-rose-400 border border-rose-900/50 hover:bg-rose-900/40 transition-all cursor-pointer"
                  title="Click to retry connection"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
                  API offline (Retry)
                </button>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/50 text-emerald-400 border border-emerald-900/50">
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                  API online
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative overflow-hidden pt-24 pb-20 sm:pt-32">
          {/* Background Gradients */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 -left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 -right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-sm text-indigo-400 mb-6 font-medium animate-fade-in">
              <Heart className="h-4 w-4 fill-indigo-400/20" />
              Empowering Care Coordination
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6">
              Healthcare Appointment & <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
                Follow-up Manager
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              A comprehensive portal to schedule checkups, organize doctor availabilities, track client recovery milestones, and log automatic progress updates in one centralized dashboard.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-semibold text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/35 transition-all duration-200 transform hover:-translate-y-0.5">
                Book an Appointment
              </button>
              <a 
                href="#features" 
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold border border-slate-800 hover:border-slate-700 transition-all duration-200 text-center"
              >
                Learn More
              </a>
            </div>

            {/* Health Status Dashboard Panel */}
            <div className="mt-16 max-w-3xl mx-auto p-6 rounded-2xl bg-slate-900/50 border border-slate-900 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                API Connection Status
              </h3>
              {loading ? (
                <div className="flex items-center justify-center space-x-3 text-slate-400 py-4">
                  <RefreshCw className="animate-spin h-5 w-5 text-indigo-500" />
                  <span>Contacting backend at {import.meta.env.VITE_API_URL || 'http://localhost:5000'}...</span>
                </div>
              ) : error ? (
                <div className="text-slate-400 py-4">
                  <div className="text-rose-500 font-semibold mb-1 flex items-center justify-center gap-2">
                    <AlertTriangle className="h-5 w-5" /> Connection Failed
                  </div>
                  <p className="text-sm text-slate-500 mb-3">{error}</p>
                  <button 
                    onClick={checkBackendHealth}
                    className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                  >
                    Retry Connection Check
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  <div className="text-emerald-400 font-semibold mb-1 flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5" /> Active & Online
                  </div>
                  <p className="text-sm text-slate-400 mb-2 font-mono bg-slate-950 py-2 px-4 rounded border border-slate-900 max-w-md mx-auto">
                    {healthStatus?.message}
                  </p>
                  <span className="text-xs text-slate-500">
                    Endpoint: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-indigo-400">GET /api/health</code>
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-slate-950 border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">
                Designed for Optimal Patient Experience
              </h2>
              <p className="text-slate-400">
                A streamlined solution providing doctors and patients with simple tools to manage health records and follow-up activities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-900/60 hover:border-slate-800 transition-all duration-300">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit mb-6">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Smart Scheduling</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Book and reschedule consultations with selected doctors based on real-time availability blocks.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-900/60 hover:border-slate-800 transition-all duration-300">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit mb-6">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Follow-up Triggers</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Track recovery milestones and configure automatic checkpoints to keep doctors informed of your recovery status.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-900/60 hover:border-slate-800 transition-all duration-300">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit mb-6">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Secure & Private</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Encryption-ready patient records, strict privacy compliance, and granular data access rights for complete confidentiality.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} AegisHealth. Build Foundation Part 1.</p>
        </div>
      </footer>
    </div>
  );
}
