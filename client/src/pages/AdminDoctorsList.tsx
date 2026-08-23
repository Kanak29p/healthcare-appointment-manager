import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { DoctorAdminInfo } from '../services/api';
import { Stethoscope, Plus, CheckCircle, XCircle, ChevronRight, RefreshCw, Eye } from 'lucide-react';

export default function AdminDoctorsList() {
  const [doctors, setDoctors] = useState<DoctorAdminInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await api.adminGetDoctors();
        setDoctors(data.doctors);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to fetch doctors list.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Doctors Directory</h1>
          <p className="text-slate-400 text-sm mt-1">Manage clinical practitioners, slot times, and leaves.</p>
        </div>
        <Link
          to="/admin/doctors/create"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-white rounded-xl text-sm transition shadow-lg shadow-indigo-650/15 transform hover:-translate-y-0.5"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add New Doctor</span>
        </Link>
      </div>

      {/* Main section */}
      {loading ? (
        <div className="flex items-center justify-center p-20">
          <RefreshCw className="animate-spin h-7 w-7 text-indigo-500 mr-3" />
          <span className="text-slate-400">Loading doctors directory...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-950/20 border border-rose-900/50 text-rose-450 text-sm">
          {error}
        </div>
      ) : doctors.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
          <Stethoscope className="h-10 w-10 text-slate-500 mx-auto mb-4" />
          <p className="font-semibold text-white">No Doctor Accounts Yet</p>
          <p className="text-sm text-slate-500 mt-1 mb-6">Click the button above to register the first practitioner account.</p>
          <Link
            to="/admin/doctors/create"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-850 border border-slate-800 text-slate-350 hover:text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
          >
            Create Practitioner Account
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-850">
              <thead className="bg-slate-950/60 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Name</th>
                  <th scope="col" className="px-6 py-4">Specialization</th>
                  <th scope="col" className="px-6 py-4">Exp (Years)</th>
                  <th scope="col" className="px-6 py-4">Slot Size</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-sm text-slate-300">
                {doctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-slate-850/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{doctor.name}</span>
                        <span className="text-slate-500 text-xs mt-0.5">{doctor.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-950 text-indigo-400 font-medium text-xs border border-slate-850">
                        {doctor.specialization}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      {doctor.experience ? `${doctor.experience} yrs` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      {doctor.slotDuration} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doctor.isActive ? (
                        <span className="inline-flex items-center text-xs font-medium text-emerald-450">
                          <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium text-slate-500">
                          <XCircle className="h-3.5 w-3.5 mr-1 text-slate-650" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                      <Link
                        to={`/admin/doctors/${doctor.id}`}
                        className="inline-flex items-center space-x-1.5 text-indigo-400 hover:text-indigo-300 bg-slate-950/40 border border-slate-850 px-3.5 py-1.5 rounded-lg hover:bg-slate-850/50 transition cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Manage Profile</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
