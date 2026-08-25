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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Doctors Directory</h1>
          <p className="text-slate-500 text-xs mt-1">Manage clinical practitioners, slot times, and leaves.</p>
        </div>
        <Link
          to="/admin/doctors/create"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 font-bold text-white rounded-xl text-sm shadow-sm transition transform hover:-translate-y-0.5"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add New Doctor</span>
        </Link>
      </div>

      {/* Main section */}
      {loading ? (
        <div className="flex items-center justify-center p-20 bg-white border border-slate-150 rounded-2xl">
          <RefreshCw className="animate-spin h-6 w-6 text-teal-600 mr-2" />
          <span className="text-slate-500 text-xs">Loading doctors directory...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      ) : doctors.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold">
          <Stethoscope className="h-10 w-10 text-slate-350 mx-auto mb-4" />
          <p className="font-bold text-slate-900 text-sm">No Doctor Accounts Yet</p>
          <p className="text-slate-450 mt-1 mb-6">Click the button above to register the first practitioner account.</p>
          <Link
            to="/admin/doctors/create"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-250 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
          >
            Create Practitioner Account
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150 text-xs">
              <thead className="bg-slate-50 text-left font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Name</th>
                  <th scope="col" className="px-6 py-4">Specialization</th>
                  <th scope="col" className="px-6 py-4">Exp (Years)</th>
                  <th scope="col" className="px-6 py-4">Slot Size</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {doctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm">{doctor.name}</span>
                        <span className="text-slate-500 font-mono text-[10px] mt-0.5">{doctor.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 font-bold text-xs border border-teal-100">
                        {doctor.specialization}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-650">
                      {doctor.experience ? `${doctor.experience} yrs` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-655 font-mono">
                      {doctor.slotDuration} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doctor.isActive ? (
                        <span className="inline-flex items-center text-xs font-bold text-emerald-700">
                          <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-bold text-slate-400">
                          <XCircle className="h-3.5 w-3.5 mr-1 text-slate-400" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold">
                      <Link
                        to={`/admin/doctors/${doctor.id}`}
                        className="inline-flex items-center space-x-1.5 text-slate-705 hover:text-teal-700 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-450" />
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
