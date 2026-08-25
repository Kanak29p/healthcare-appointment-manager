import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { DoctorAdminInfo } from '../services/api';
import { Calendar, Clock, ArrowLeft, CheckCircle2, Trash2, Plus, Info, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';

type TabType = 'info' | 'hours' | 'leaves';

export default function AdminDoctorDetail() {
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<DoctorAdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('info');

  // Form State - Doctor Info
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [slotDuration, setSlotDuration] = useState('30');
  const [isActive, setIsActive] = useState(true);

  // Form State - Availability
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [availError, setAvailError] = useState<string | null>(null);

  // Form State - Leaves
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const fetchDoctorData = async () => {
    if (!id) return;
    try {
      const res = await api.adminGetDoctor(id);
      const doc = res.doctor;
      setDoctor(doc);
      
      // Populate fields
      setName(doc.name);
      setSpecialization(doc.specialization);
      setExperience(doc.experience ? String(doc.experience) : '');
      setSlotDuration(String(doc.slotDuration));
      setIsActive(doc.isActive);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to retrieve doctor details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [id]);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 3000);
  };

  // 1. Update Doctor Info
  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);
    try {
      const expNum = experience ? parseInt(experience, 10) : null;
      const durationNum = parseInt(slotDuration, 10);
      
      await api.adminUpdateDoctor(id, {
        name,
        specialization,
        experience: expNum,
        slotDuration: durationNum,
        isActive
      });

      showNotification('Doctor profile details updated successfully');
      fetchDoctorData();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile details.');
    }
  };

  // 2. Add Availability
  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !doctor?.doctorProfileId) return;
    setAvailError(null);
    try {
      await api.adminAddAvailability(id, {
        dayOfWeek,
        startTime,
        endTime
      });
      showNotification(`Added working hours for ${dayOfWeek}`);
      fetchDoctorData();
      // Reset
      setStartTime('09:00');
      setEndTime('17:00');
    } catch (err: any) {
      setAvailError(err.message || 'Failed to add availability slot.');
    }
  };

  // 3. Delete Availability
  const handleDeleteAvailability = async (availId: string) => {
    if (!id) return;
    try {
      await api.adminDeleteAvailability(id, availId);
      showNotification('Availability slot removed');
      fetchDoctorData();
    } catch (err: any) {
      showNotification(`Error: ${err.message || 'Failed to delete slot.'}`);
    }
  };

  // 4. Add Leave
  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !doctor?.doctorProfileId) return;
    setLeaveError(null);
    try {
      await api.adminAddLeave(id, {
        leaveDate,
        reason: leaveReason || null
      });
      showNotification(`Leave date added successfully`);
      fetchDoctorData();
      // Reset
      setLeaveDate('');
      setLeaveReason('');
    } catch (err: any) {
      setLeaveError(err.message || 'Failed to add leave date.');
    }
  };

  // 5. Delete Leave
  const handleDeleteLeave = async (leaveId: string) => {
    if (!id) return;
    try {
      await api.adminDeleteLeave(id, leaveId);
      showNotification('Leave date removed');
      fetchDoctorData();
    } catch (err: any) {
      showNotification(`Error: ${err.message || 'Failed to remove leave date.'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 bg-white border border-slate-150 rounded-2xl animate-fade-in">
        <RefreshCw className="animate-spin h-6 w-6 text-teal-600 mr-2" />
        <span className="text-slate-500 text-xs">Retrieving practitioner records...</span>
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="space-y-4 max-w-md">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
        <Link to="/admin/doctors" className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700 transition">
          ← Return to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Back Button */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/doctors"
          className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to directory</span>
        </Link>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${doctor?.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
          {doctor?.isActive ? 'Active Status' : 'Inactive Status'}
        </span>
      </div>

      {/* Doctor Meta Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{doctor?.name}</h1>
          <p className="text-slate-500 text-xs mt-1">Specialization: {doctor?.specialization} | Email: {doctor?.email}</p>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-250 text-emerald-750 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 mr-1" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-5 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'info'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4" />
            <span>Profile Details</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('hours')}
          className={`px-5 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'hours'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Working Hours</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-5 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'leaves'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Leave Periods</span>
          </div>
        </button>
      </div>

      {/* TAB 1: Profile Details */}
      {activeTab === 'info' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm max-w-2xl">
          <form onSubmit={handleUpdateInfo} className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Edit Profile Attributes</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Practitioner Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-white border border-slate-350 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Specialization
                </label>
                <input
                  type="text"
                  required
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-white border border-slate-350 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Experience <span className="text-slate-400 text-[10px] font-medium">(Years)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-white border border-slate-350 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Slot Duration <span className="text-slate-400 text-[10px] font-medium">(Minutes)</span>
                </label>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-white border border-slate-350 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                >
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                Active Status
              </label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className="flex items-center space-x-3 text-slate-700 hover:text-slate-900 transition cursor-pointer"
              >
                {isActive ? (
                  <ToggleRight className="h-9 w-9 text-teal-600" />
                ) : (
                  <ToggleLeft className="h-9 w-9 text-slate-450" />
                )}
                <span className="text-xs font-semibold">
                  {isActive ? 'Account Enabled (Accepts appointments)' : 'Account Suspended (Restricted)'}
                </span>
              </button>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 font-bold text-white rounded-xl text-sm transition cursor-pointer shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Working Hours */}
      {activeTab === 'hours' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Availability Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit">
            <form onSubmit={handleAddAvailability} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Add Hours</h3>
              
              {availError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {availError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Day of Week
                </label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-slate-350 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-slate-350 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-slate-350 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-sm transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Time Slot</span>
              </button>
            </form>
          </div>

          {/* Availability Slots List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Availability Schedule</h3>
            
            {doctor?.availabilities && doctor.availabilities.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                No active availability slots registered. Doctor is currently unavailable for bookings.
              </div>
            ) : (
              <div className="space-y-3">
                {doctor?.availabilities?.map((avail) => (
                  <div
                    key={avail.id}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-350 transition-all text-xs"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{avail.dayOfWeek}</span>
                        <p className="text-slate-500 font-mono text-xs mt-0.5">{avail.startTime} - {avail.endTime}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteAvailability(avail.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete slot"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Leave Periods */}
      {activeTab === 'leaves' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Leave Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit">
            <form onSubmit={handleAddLeave} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Record Leave</h3>
              
              {leaveError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {leaveError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Leave Date
                </label>
                <input
                  type="date"
                  required
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-slate-350 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Reason <span className="text-slate-400 text-[10px] font-medium">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-slate-350 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  placeholder="Medical, Holiday, etc."
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-sm transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Register Leave</span>
              </button>
            </form>
          </div>

          {/* Leave Dates List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Leaves Calendar</h3>
            
            {doctor?.leaves && doctor.leaves.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                No leave periods registered. Doctor is currently active.
              </div>
            ) : (
              <div className="space-y-3">
                {doctor?.leaves?.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-350 transition-all text-xs"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm">
                          {new Date(leave.leaveDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                        </span>
                        <p className="text-slate-500 text-xs mt-0.5">{leave.reason || 'No reason provided'}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteLeave(leave.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove leave"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
