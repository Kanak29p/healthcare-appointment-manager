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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans">
        <RefreshCw className="animate-spin h-8 w-8 text-indigo-500 mb-4" />
        <p className="text-slate-400 text-sm">Loading visit summary details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center shadow-xl">
          <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Error Loading Summary</h2>
          <p className="text-sm text-slate-400 mb-6">{error || 'Data could not be retrieved.'}</p>
          <Link
            to="/patient/appointments"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 font-semibold text-white rounded-xl transition"
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
          className="inline-flex items-center space-x-2 text-sm text-slate-450 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to My Appointments</span>
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="bg-gradient-to-tr from-indigo-950/40 to-violet-955/30 border border-slate-900 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 shadow-xl">
        <div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-900/30">
            Official Health Record
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">Consultation Post-Visit Summary</h1>
          <p className="text-slate-400 text-sm mt-1">Review clinical directions, prescription instructions, and follow-up guidance.</p>
        </div>
        <div className="flex items-center space-x-2.5 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-xl text-xs text-slate-350">
          <CalendarDays className="h-4.5 w-4.5 text-indigo-400" />
          <span>
            {new Date(appointment.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Consultation Meta Details & Clinical Notes */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Metadata Card */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-lg">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Clinical Context</h3>
            
            <div className="space-y-3.5 text-sm border-t border-slate-850 pt-3">
              <div>
                <span className="text-slate-500 block text-xs">Consulting Practitioner:</span>
                <span className="text-slate-200 font-semibold">{appointment.doctorName}</span>
                <span className="block text-slate-400 text-xs mt-0.5">{appointment.specialization}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Appointment ID:</span>
                <span className="text-slate-450 font-mono text-[11px] break-all">{appointment.id}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 text-xs">Record Status:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-900/30">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  <span>Verified</span>
                </span>
              </div>
            </div>
          </div>

          {/* Clinical notes card */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3 shadow-lg">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="h-4 w-4 text-indigo-400" />
              <span>Practitioner Clinical Notes</span>
            </h3>
            <div className="border-t border-slate-850 pt-2.5 text-slate-350 text-xs leading-relaxed italic bg-slate-950 p-3.5 rounded-xl border border-slate-900">
              {notes ? `"${notes}"` : 'No notes registered.'}
            </div>
          </div>
        </div>

        {/* Right column: AI Post-Visit summary & Prescription details */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Post-Visit AI Summary */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-5 shadow-lg relative overflow-hidden">
            {/* Background glowing glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
              <span>Patient-Friendly AI Summary</span>
            </h2>

            {postVisitSummary ? (
              postVisitSummary.status === 'SUCCESS' ? (
                <div className="space-y-5 text-sm border-t border-slate-850 pt-4 leading-relaxed">
                  <div>
                    <h3 className="font-semibold text-slate-200 mb-1.5">Visit Summary:</h3>
                    <p className="text-slate-350 bg-slate-950 p-4 rounded-xl border border-slate-900">
                      {postVisitSummary.summary}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-200 mb-2">Medication Intake Schedule:</h3>
                    {postVisitSummary.medicationSchedule && postVisitSummary.medicationSchedule.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2.5">
                        {postVisitSummary.medicationSchedule.map((med, idx) => (
                          <div 
                            key={idx} 
                            className="bg-slate-950 p-3.5 rounded-xl border border-slate-900 flex items-start space-x-3"
                          >
                            <div className="p-2 bg-indigo-950/50 rounded-lg text-indigo-455 mt-0.5 border border-indigo-900/10">
                              <Clock className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-200 text-xs">{med.medicineName}</h4>
                              <p className="text-xs text-slate-450 mt-0.5 leading-normal">{med.instructions}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No medications schedule generated.</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-200 mb-2">Recommended Follow-up Steps:</h3>
                    {postVisitSummary.followUpSteps && postVisitSummary.followUpSteps.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1.5 text-slate-350 bg-slate-950 p-4 rounded-xl border border-slate-900 text-xs">
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
                <div className="p-4 bg-rose-955/20 border border-rose-950/20 text-rose-450 text-xs italic rounded-xl border-dashed">
                  Post-visit summary temporarily unavailable.
                </div>
              )
            ) : (
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl text-center text-xs text-slate-550 italic">
                AI summary generation is currently pending or not yet processed.
              </div>
            )}
          </div>

          {/* Prescription & Medications list */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-4 shadow-lg">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Pill className="h-4.5 w-4.5 text-violet-400" />
              <span>Official Prescription & Medications</span>
            </h2>

            {prescription ? (
              <div className="space-y-4 border-t border-slate-850 pt-4 text-xs">
                {prescription.medications && prescription.medications.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-slate-850">
                    <table className="min-w-full divide-y divide-slate-850 bg-slate-950">
                      <thead>
                        <tr className="bg-slate-900/60 text-slate-450 text-[10px] uppercase font-bold tracking-wider">
                          <th className="px-4 py-2.5 text-left">Medicine Name</th>
                          <th className="px-4 py-2.5 text-left">Dosage</th>
                          <th className="px-4 py-2.5 text-left">Frequency</th>
                          <th className="px-4 py-2.5 text-left">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-slate-350">
                        {prescription.medications.map((med, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-medium text-slate-200">{med.medicineName}</td>
                            <td className="px-4 py-2.5">{med.dosage}</td>
                            <td className="px-4 py-2.5 font-mono text-violet-400">{med.frequency}</td>
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
                  <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-900">
                    <span className="text-slate-500 block font-semibold mb-1 text-[10px] uppercase tracking-wider">Special Intake Instructions:</span>
                    <p className="text-slate-300 italic">"{prescription.instructions}"</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-4 border-t border-slate-850">
                No prescription registered for this consultation checkup.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
