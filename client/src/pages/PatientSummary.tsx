import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { PatientPostVisitSummaryResponse } from '../services/api';
import { 
  ArrowLeft, 
  User, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Pill, 
  Sparkles, 
  CalendarDays,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function PatientSummary() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PatientPostVisitSummaryResponse | null>(null);

  const fetchSummary = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getPatientPostVisitSummary(id);
      setData(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load post-visit summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center font-sans">
        <RefreshCw className="animate-spin h-8 w-8 text-teal-600 mb-4" />
        <p className="text-slate-550 text-sm">Loading visit summary details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full p-6 bg-white border border-slate-200 rounded-2xl text-center shadow-sm">
          <AlertTriangle className="h-12 w-12 text-rose-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Error Loading Summary</h2>
          <p className="text-sm text-slate-500 mb-6">{error || 'Data could not be retrieved.'}</p>
          <Link
            to="/patient/appointments"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 font-bold text-white rounded-xl transition shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Appointments</span>
          </Link>
        </div>
      </div>
    );
  }

  const { appointment, notes, prescription, postVisitSummary } = data;

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans animate-fade-in">
      {/* Back button */}
      <div>
        <Link
          to="/patient/appointments"
          className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to My Appointments</span>
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-teal-600 px-2.5 py-1 rounded-full shadow-sm">
            Official Health Record
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 tracking-tight">Consultation Post-Visit Summary</h1>
          <p className="text-slate-600 text-xs mt-1">Review clinical directions, prescription instructions, and follow-up guidance.</p>
        </div>
        <div className="flex items-center space-x-2.5 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs text-slate-700 font-bold shadow-sm shrink-0">
          <CalendarDays className="h-4.5 w-4.5 text-teal-600" />
          <span>
            {new Date(appointment.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Consultation Meta Details & Clinical Notes */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Metadata Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinical Context</h3>
            
            <div className="space-y-3.5 text-xs border-t border-slate-100 pt-3 text-slate-650">
              <div>
                <span className="text-slate-500 block">Consulting Practitioner:</span>
                <span className="text-slate-900 font-bold text-sm">{appointment.doctorName}</span>
                <span className="block text-teal-700 font-semibold mt-0.5">{appointment.specialization}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Appointment ID:</span>
                <span className="text-slate-500 font-mono text-[10px] break-all">{appointment.id}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-500">Record Status:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-250">
                  <ShieldCheck className="h-3 w-3 mr-1 text-emerald-600" />
                  <span>Verified</span>
                </span>
              </div>
            </div>
          </div>

          {/* Clinical notes card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="h-4 w-4 text-teal-600" />
              <span>Practitioner Clinical Notes</span>
            </h3>
            <div className="border-t border-slate-100 pt-2.5 text-slate-700 text-xs leading-relaxed italic bg-slate-50 p-3.5 rounded-xl border border-slate-150">
              {notes ? `"${notes}"` : 'No notes registered.'}
            </div>
          </div>
        </div>

        {/* Right column: AI Post-Visit summary & Prescription details */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Post-Visit AI Summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm relative overflow-hidden">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Sparkles className="h-4.5 w-4.5 text-teal-600" />
              <span>Patient-Friendly AI Summary</span>
            </h2>

            {postVisitSummary ? (
              postVisitSummary.status === 'SUCCESS' ? (
                <div className="space-y-5 text-xs leading-relaxed text-slate-650">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1.5">Visit Summary:</h3>
                    <p className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-150">
                      {postVisitSummary.summary}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-2">Medication Intake Schedule:</h3>
                    {postVisitSummary.medicationSchedule && postVisitSummary.medicationSchedule.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2.5">
                        {postVisitSummary.medicationSchedule.map((med, idx) => (
                          <div 
                            key={idx} 
                            className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 flex items-start space-x-3"
                          >
                            <div className="p-2 bg-teal-50 rounded-lg text-teal-700 mt-0.5 border border-teal-100">
                              <Clock className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-xs">{med.medicineName}</h4>
                              <p className="text-xs text-slate-550 mt-0.5 leading-normal">{med.instructions}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No medications schedule generated.</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-2">Recommended Follow-up Steps:</h3>
                    {postVisitSummary.followUpSteps && postVisitSummary.followUpSteps.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1.5 text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs">
                        {postVisitSummary.followUpSteps.map((step, idx) => (
                          <li key={idx} className="leading-relaxed">{step}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No follow-up steps provided.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs italic rounded-xl border-dashed">
                  Post-visit summary temporarily unavailable.
                </div>
              )
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl text-center text-xs text-slate-450 italic">
                AI summary generation is currently pending or not yet processed.
              </div>
            )}
          </div>

          {/* Prescription & Medications list */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Pill className="h-4.5 w-4.5 text-teal-600" />
              <span>Official Prescription & Medications</span>
            </h2>

            {prescription ? (
              <div className="space-y-4 border-t border-slate-100 pt-4 text-xs">
                {prescription.medications && prescription.medications.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-150 bg-white">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                          <th className="px-4 py-2.5 text-left">Medicine Name</th>
                          <th className="px-4 py-2.5 text-left">Dosage</th>
                          <th className="px-4 py-2.5 text-left">Frequency</th>
                          <th className="px-4 py-2.5 text-left">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {prescription.medications.map((med, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-bold text-slate-900">{med.medicineName}</td>
                            <td className="px-4 py-2.5">{med.dosage}</td>
                            <td className="px-4 py-2.5 font-mono text-teal-700 font-bold">{med.frequency}</td>
                            <td className="px-4 py-2.5">{med.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No specific medications itemized.</p>
                )}

                {prescription.instructions && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-150">
                    <span className="text-slate-500 block font-bold mb-1 text-[10px] uppercase tracking-wider">Special Intake Instructions:</span>
                    <p className="text-slate-700 italic">"{prescription.instructions}"</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-4 border-t border-slate-100">
                No prescription registered for this consultation checkup.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
