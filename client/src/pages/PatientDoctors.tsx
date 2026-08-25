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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Find a Medical Practitioner</h1>
        <p className="text-slate-500 text-xs mt-1">Search active doctors and book clinical sessions.</p>
      </div>

      {/* Search Input bar */}
      <form onSubmit={handleSearch} className="flex gap-3 max-w-lg bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-grow rounded-xl">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </div>
          <input
            type="text"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm"
            placeholder="Search specialization (e.g. Cardiology)..."
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-sm transition cursor-pointer disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {/* Main doctor grid list */}
      {loading ? (
        <div className="flex items-center justify-center p-20 bg-white border border-slate-150 rounded-2xl">
          <RefreshCw className="animate-spin h-6 w-6 text-teal-600 mr-2" />
          <span className="text-slate-500 text-xs">Searching active directory...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      ) : doctors.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white border border-slate-200 text-slate-550 text-xs font-semibold">
          No doctors found matching the search filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-slate-350 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-3.5 mb-4 pb-3 border-b border-slate-100">
                  <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-100 shrink-0">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div className="truncate">
                    <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">{doctor.name}</h3>
                    <p className="text-slate-500 text-[10px] mt-0.5 font-mono truncate">{doctor.email}</p>
                  </div>
                </div>

                <div className="space-y-2 mt-4 text-xs text-slate-650">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Specialization:</span>
                    <span className="font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full text-[10px] border border-teal-100">
                      {doctor.specialization}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Experience:</span>
                    <span className="flex items-center text-slate-700 font-semibold">
                      <Star className="h-3.5 w-3.5 fill-amber-450 text-amber-450 mr-1" />
                      {doctor.experience ? `${doctor.experience} Years` : 'Provisioned'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Slot Duration:</span>
                    <span className="font-semibold text-slate-700">{doctor.slotDuration} mins</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  to={`/patient/doctors/${doctor.id}`}
                  className="w-full inline-flex items-center justify-center space-x-2 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-teal-700 rounded-xl text-xs font-bold transition cursor-pointer"
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
