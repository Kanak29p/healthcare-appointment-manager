import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  ArrowLeft, 
  User, 
  Clock, 
  Stethoscope, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  Plus, 
  Trash2, 
  RefreshCw, 
  FileText, 
  Pill 
} from 'lucide-react';

interface MedicationItem {
  id?: string;
  medicineName: string;
  dosage: string;
  frequency: 'ONCE_DAILY' | 'TWICE_DAILY' | 'THREE_TIMES_DAILY' | 'AS_NEEDED';
  duration: string;
}

export default function DoctorConsultation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Core loading/status states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [appointment, setAppointment] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [instructions, setInstructions] = useState('');
  const [medications, setMedications] = useState<MedicationItem[]>([]);

  // Individual button loading states
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [completing, setCompleting] = useState(false);

  // New Medication item state
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState<'ONCE_DAILY' | 'TWICE_DAILY' | 'THREE_TIMES_DAILY' | 'AS_NEEDED'>('ONCE_DAILY');
  const [medDuration, setMedDuration] = useState('');
  const [medError, setMedError] = useState<string | null>(null);

  const fetchAppointmentDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getDoctorAppointmentDetail(id);
      setAppointment(data.appointment);
      setNotes(data.appointment.consultation?.notes || '');
      setInstructions(data.appointment.consultation?.prescription?.instructions || '');
      setMedications(data.appointment.consultation?.prescription?.medications || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load consultation details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentDetail();
  }, [id]);

  const handleSaveNotes = async () => {
    if (!id) return;
    if (!notes.trim()) {
      setError('Consultation notes cannot be empty.');
      return;
    }

    try {
      setSavingNotes(true);
      setError(null);
      setSuccessMessage(null);
      await api.saveConsultation(id, notes);
      setSuccessMessage('Consultation notes saved successfully!');
      // Refresh details to make sure consultation record ID exists
      const data = await api.getDoctorAppointmentDetail(id);
      setAppointment(data.appointment);
    } catch (err: any) {
      setError(err.message || 'Failed to save notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAddMedication = () => {
    setMedError(null);
    if (!medName.trim() || !medDosage.trim() || !medDuration.trim()) {
      setMedError('Please fill out all medication fields.');
      return;
    }

    const newItem: MedicationItem = {
      medicineName: medName,
      dosage: medDosage,
      frequency: medFrequency,
      duration: medDuration
    };

    setMedications([...medications, newItem]);
    
    // Reset inputs
    setMedName('');
    setMedDosage('');
    setMedFrequency('ONCE_DAILY');
    setMedDuration('');
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSavePrescription = async () => {
    if (!id) return;
    if (!appointment?.consultation) {
      setError('You must save clinical notes first to establish a consultation record.');
      return;
    }

    try {
      setSavingPrescription(true);
      setError(null);
      setSuccessMessage(null);
      await api.savePrescription(id, { instructions, medications });
      setSuccessMessage('Prescription instructions and medications saved successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to save prescription.');
    } finally {
      setSavingPrescription(false);
    }
  };

  const handleCompleteAppointment = async () => {
    if (!id) return;
    
    if (!notes.trim()) {
      setError('Consultation notes are required to complete the visit.');
      return;
    }

    try {
      setCompleting(true);
      setError(null);
      setSuccessMessage(null);

      // 1. Save notes first
      await api.saveConsultation(id, notes);
      
      // 2. Save prescription if there are medications
      if (medications.length > 0) {
        // Fetch fresh details to verify consultation relationship exists
        const data = await api.getDoctorAppointmentDetail(id);
        if (data.appointment.consultation) {
          await api.savePrescription(id, { instructions, medications });
        }
      }

      // 3. Complete visit (handles AI summary generation in try-catch on server)
      const completeRes = await api.completeAppointment(id);
      
      if (completeRes.postVisitSummary?.status === 'FAILED') {
        setSuccessMessage('Appointment completed! Note: Post-visit summary is temporarily unavailable (AI failed).');
      } else {
        setSuccessMessage('Appointment completed and patient post-visit summary generated successfully!');
      }

      setTimeout(() => {
        navigate('/doctor/dashboard');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to complete appointment.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center font-sans">
        <RefreshCw className="animate-spin h-8 w-8 text-teal-600 mb-4" />
        <p className="text-slate-550 text-sm">Loading appointment details...</p>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full p-6 bg-white border border-slate-200 rounded-2xl text-center shadow-sm">
          <AlertTriangle className="h-12 w-12 text-rose-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Error Loading Visit</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <Link
            to="/doctor/dashboard"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 font-bold text-white rounded-xl transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/doctor/dashboard" className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition-colors font-bold">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm hidden sm:inline">Back to Dashboard</span>
            </Link>
          </div>
          <span className="text-sm font-bold text-slate-900">
            AegisHealth Practitioner Portal
          </span>
        </div>
      </header>

      {/* Main Form container */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Consultation Workspace</h1>
              <p className="text-slate-500 text-xs mt-0.5">Recording details for patient appointment.</p>
            </div>
            <div className="mt-3 sm:mt-0 flex items-center space-x-2.5 text-xs bg-teal-50 border border-teal-100 px-4 py-2 rounded-xl text-teal-700 font-mono font-bold">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {new Date(appointment.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} | {new Date(appointment.startTime).getUTCHours().toString().padStart(2, '0')}:{new Date(appointment.startTime).getUTCMinutes().toString().padStart(2, '0')} UTC
              </span>
            </div>
          </div>

          {/* Success / Error Feedback */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-700 animate-fade-in">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0 text-rose-600" />
              <span className="text-xs font-semibold">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3 text-emerald-700 animate-fade-in">
              <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0 text-emerald-600" />
              <span className="text-xs font-semibold">{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Patient Info & Pre-Visit AI Summary */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Patient Profile Details Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center space-x-2">
                  <User className="h-4.5 w-4.5 text-teal-600" />
                  <span>Patient Information</span>
                </h3>
                <div className="space-y-3 text-xs border-t border-slate-100 pt-3 text-slate-650">
                  <div>
                    <span className="text-slate-500 block">Full Name:</span>
                    <span className="text-slate-900 font-bold text-sm">{appointment.patientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Recorded Symptoms:</span>
                    <span className="text-slate-700 italic block mt-1 bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs leading-normal">
                      "{appointment.symptoms || 'None recorded.'}"
                    </span>
                  </div>
                </div>
              </div>

              {/* Pre-Visit AI Summary Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center space-x-2">
                  <Stethoscope className="h-4.5 w-4.5 text-teal-600" />
                  <span>AI Pre-Visit Assessment</span>
                </h3>
                
                {appointment.aiSummary ? (
                  appointment.aiSummary.status === 'SUCCESS' ? (
                    <div className="space-y-3.5 text-xs border-t border-slate-100 pt-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">Urgency Assessment:</span>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          appointment.aiSummary.urgency === 'HIGH' 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : appointment.aiSummary.urgency === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {appointment.aiSummary.urgency}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-0.5">Chief Complaint Summary:</span>
                        <p className="text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-150 font-medium">
                          {appointment.aiSummary.chiefComplaint}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Doctor Questions to Ask:</span>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-750 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          {appointment.aiSummary.suggestedQuestions?.map((q: string, idx: number) => (
                            <li key={idx} className="leading-normal">{q}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs italic rounded-lg">
                      AI pre-visit summary was temporarily unavailable during booking.
                    </div>
                  )
                ) : (
                  <div className="text-xs text-slate-400 italic text-center py-4">
                    No pre-visit summary has been generated for this appointment.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Consultation Notes & Prescriptions Editor */}
            <div className="lg:col-span-2 space-y-6 animate-fade-in">
              
              {/* Consultation Notes Section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <FileText className="h-4.5 w-4.5 text-teal-600" />
                    <span>Clinical Consultation Notes</span>
                  </h3>
                  {appointment.status === 'CONFIRMED' && (
                    <button
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      {savingNotes ? (
                        <RefreshCw className="animate-spin h-3 w-3" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                      <span>Save Notes</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500">
                    Clinical Observations, Findings, and Assessment:
                  </label>
                  <textarea
                    rows={6}
                    value={notes}
                    disabled={appointment.status === 'COMPLETED'}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter post-visit observations, vital signs, clinical judgment..."
                    className="block w-full p-3 bg-white border border-slate-350 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-xs font-sans"
                  />
                </div>
              </div>

              {/* Prescription Manager Section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <Pill className="h-4.5 w-4.5 text-teal-600" />
                    <span>Prescribed Medications</span>
                  </h3>
                  {appointment.status === 'CONFIRMED' && (
                    <button
                      onClick={handleSavePrescription}
                      disabled={savingPrescription}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      {savingPrescription ? (
                        <RefreshCw className="animate-spin h-3 w-3" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                      <span>Save Prescription</span>
                    </button>
                  )}
                </div>

                {appointment.status === 'CONFIRMED' && (
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add New Medicine</h4>
                    {medError && (
                      <div className="p-2 text-rose-700 bg-rose-50 border border-rose-200 text-xs rounded">
                        {medError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Medicine Name</label>
                        <input
                          type="text"
                          value={medName}
                          onChange={(e) => setMedName(e.target.value)}
                          placeholder="e.g. Ibuprofen"
                          className="block w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dosage</label>
                        <input
                          type="text"
                          value={medDosage}
                          onChange={(e) => setMedDosage(e.target.value)}
                          placeholder="e.g. 400 mg"
                          className="block w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Frequency</label>
                        <select
                          value={medFrequency}
                          onChange={(e: any) => setMedFrequency(e.target.value)}
                          className="block w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                        >
                          <option value="ONCE_DAILY">Once Daily</option>
                          <option value="TWICE_DAILY">Twice Daily</option>
                          <option value="THREE_TIMES_DAILY">Three Times Daily</option>
                          <option value="AS_NEEDED">As Needed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Duration</label>
                        <input
                          type="text"
                          value={medDuration}
                          onChange={(e) => setMedDuration(e.target.value)}
                          placeholder="e.g. 5 days"
                          className="block w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMedication}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Medicine</span>
                    </button>
                  </div>
                )}

                {/* Medications List Table */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-550 block">Medications List:</span>
                  {medications.length === 0 ? (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl text-center border border-slate-150 border-dashed">
                      No medications added to this prescription yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-150 bg-white text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                            <th className="px-4 py-2.5 text-left">Medicine Name</th>
                            <th className="px-4 py-2.5 text-left">Dosage</th>
                            <th className="px-4 py-2.5 text-left">Frequency</th>
                            <th className="px-4 py-2.5 text-left">Duration</th>
                            {appointment.status === 'CONFIRMED' && (
                              <th className="px-4 py-2.5 text-center w-10">Action</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {medications.map((med, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2.5 font-bold text-slate-900">{med.medicineName}</td>
                              <td className="px-4 py-2.5">{med.dosage}</td>
                              <td className="px-4 py-2.5 font-mono text-[11px] text-teal-700 font-bold">{med.frequency}</td>
                              <td className="px-4 py-2.5">{med.duration}</td>
                              {appointment.status === 'CONFIRMED' && (
                                <td className="px-4 py-2.5 text-center">
                                  <button
                                    onClick={() => handleRemoveMedication(idx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Prescription Timing instructions */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500">
                    General Prescription Intake Instructions:
                  </label>
                  <input
                    type="text"
                    value={instructions}
                    disabled={appointment.status === 'COMPLETED'}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g. Take twice daily after meals, complete the entire course."
                    className="block w-full p-2.5 bg-white border border-slate-350 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>
              </div>

              {/* Complete Appointment Action Area */}
              {appointment.status === 'CONFIRMED' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Finalize Patient Visit</h4>
                    <p className="text-xs text-slate-500 mt-1">Completing this checkup will update its status and trigger AI post-visit summarization.</p>
                  </div>
                  <button
                    onClick={handleCompleteAppointment}
                    disabled={completing}
                    className="inline-flex justify-center items-center py-2.5 px-6 rounded-xl border border-transparent text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm disabled:opacity-50 transition cursor-pointer"
                  >
                    {completing ? (
                      <>
                        <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                        <span>Completing Visit...</span>
                      </>
                    ) : (
                      <span>Complete Appointment</span>
                    )}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
