import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Stethoscope, User, Mail, KeyRound, Clock, Heart, ArrowLeft, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AdminDoctorCreate() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [slotDuration, setSlotDuration] = useState('30');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const expNum = experience ? parseInt(experience, 10) : null;
      const durationNum = parseInt(slotDuration, 10);

      await api.adminCreateDoctor({
        name,
        email,
        password,
        specialization,
        experience: expNum,
        slotDuration: durationNum
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/doctors');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create doctor account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back button */}
      <div>
        <Link
          to="/admin/doctors"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to directory</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Register Clinical Practitioner</h1>
        <p className="text-slate-400 text-sm mt-1">This will provision a doctor user account and clinical profile.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 flex items-start space-x-3 text-rose-450 animate-fade-in">
            <ShieldAlert className="h-5 w-5 mt-0.5 flex-shrink-0 text-rose-500" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-900/50 flex items-start space-x-3 text-emerald-400 animate-fade-in">
            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0 text-emerald-550" />
            <div className="text-sm font-medium">
              <p className="font-semibold">Doctor account provisioned!</p>
              <p className="text-xs text-emerald-500 mt-1">Returning to directory list...</p>
            </div>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* User Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-850">
              Account Credentials
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-350 mb-1">
                  Practitioner Name
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                    placeholder="Dr. Gregory House"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-355 mb-1">
                  Email Address
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                    placeholder="doctor@aegishealth.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-355 mb-1">
                Portal Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="h-4.5 w-4.5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* Clinical Profile Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-850">
              Clinical Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-350 mb-1">
                  Specialization
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Stethoscope className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                    placeholder="Cardiology, Pediatrics, etc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-350 mb-1">
                  Experience <span className="text-slate-500 text-xs">(Years, Optional)</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Heart className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                    placeholder="8"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-350 mb-1">
                Consultation Slot Duration <span className="text-slate-500 text-xs">(Minutes)</span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                >
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-850">
            <Link
              to="/admin/doctors"
              className="px-6 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || success}
              className="inline-flex justify-center items-center py-2.5 px-6 rounded-xl border border-transparent text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 disabled:opacity-50 transitioncursor-pointer"
            >
              {loading ? 'Creating account...' : 'Create Account'}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
