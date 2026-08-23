import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { DoctorAdminInfo } from '../services/api';
import { Stethoscope, Search, RefreshCw, Star, ArrowRight } from 'lucide-react';

export default function PatientDoctors() {
  const [doctors, setDoctors] = useState<DoctorAdminInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specialization, setSpecialization] = useState('');

  const fetchDoctors = async (specFilter?: string) => {
    setLoading(true);
    try {
      const data = await api.getDoctors(specFilter);
      setDoctors(data.doctors);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to search doctors directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDoctors(specialization.trim());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Find a Medical Practitioner</h1>
        <p className="text-slate-400 text-sm mt-1">Search active doctors and book clinical sessions.</p>
      </div>

      {/* Search Input bar */}
      <form onSubmit={handleSearch} className="flex gap-3 max-w-lg bg-slate-900 p-2.5 rounded-2xl border border-slate-800 shadow-lg">
        <div className="relative flex-grow rounded-xl">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="h-4.5 w-4.5" />
          </div>
          <input
            type="text"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
            placeholder="Search specialization (e.g. Cardiology)..."
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-indigo-650 hover:bg-indigo-550 text-white font-semibold rounded-xl text-sm transition cursor-pointer disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {/* Main doctor grid list */}
      {loading ? (
        <div className="flex items-center justify-center p-20">
          <RefreshCw className="animate-spin h-7 w-7 text-indigo-500 mr-3" />
          <span className="text-slate-400">Searching active directory...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-455 text-sm">
          {error}
        </div>
      ) : doctors.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-sm">
          No doctors found matching the search filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-3.5 mb-4">
                  <div className="p-2.5 bg-gradient-to-tr from-indigo-950/80 to-indigo-900/80 text-indigo-400 rounded-xl border border-indigo-900/20">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base leading-tight">{doctor.name}</h3>
                    <p className="text-slate-550 text-xs mt-0.5">{doctor.email}</p>
                  </div>
                </div>

                <div className="space-y-2 mt-4 text-sm text-slate-350">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Specialization:</span>
                    <span className="font-medium text-indigo-400 bg-indigo-950/30 px-2 py-0.5 rounded text-xs border border-indigo-950/20">
                      {doctor.specialization}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Experience:</span>
                    <span className="flex items-center text-xs font-semibold text-slate-300">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 mr-1" />
                      {doctor.experience ? `${doctor.experience} Years` : 'Provisioned'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Slot Duration:</span>
                    <span className="font-medium text-xs text-slate-300">{doctor.slotDuration} mins</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-850">
                <Link
                  to={`/patient/doctors/${doctor.id}`}
                  className="w-full inline-flex items-center justify-center space-x-2 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  <span>Check Availability</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
