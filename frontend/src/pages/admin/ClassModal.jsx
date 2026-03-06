import { useState, useEffect } from 'react';
import { X, Save, Clock, BookOpen, Users, DollarSign, Calendar } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ClassModal = ({ isOpen, onClose, classData, onSave, teachers = [] }) => {
    // Mode
    const isEdit = !!classData;

    // State 1: Basic Info
    const [className, setClassName] = useState('');
    const [subject, setSubject] = useState('');
    const [batchName, setBatchName] = useState('');
    const [teacherId, setTeacherId] = useState('');
    const [maxStudents, setMaxStudents] = useState(40);
    const [startDate, setStartDate] = useState('');
    const [status, setStatus] = useState('ACTIVE');

    // State 2: Schedule Details (Stored as JSON in DB)
    const [selectedDays, setSelectedDays] = useState([]);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [duration, setDuration] = useState(60);
    const [room, setRoom] = useState('');

    // State 3: Fees Config
    const [monthlyFee, setMonthlyFee] = useState(0);
    const [admissionFee, setAdmissionFee] = useState(0);
    const [lateFeePenalty, setLateFeePenalty] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initialize state
    useEffect(() => {
        if (isOpen && classData) {
            setClassName(classData.class_name || '');
            setSubject(classData.subject || '');
            setBatchName(classData.batch_name || '');
            setTeacherId(classData.teacher_id || '');
            setMaxStudents(classData.max_students || 40);
            if (classData.start_date) {
                // Formatting date for HTML input type="date"
                const dateObj = new Date(classData.start_date);
                if (!isNaN(dateObj)) {
                    setStartDate(dateObj.toISOString().split('T')[0]);
                }
            }
            setStatus(classData.status || 'ACTIVE');

            setMonthlyFee(classData.monthly_fee || 0);
            setAdmissionFee(classData.admission_fee || 0);
            setLateFeePenalty(classData.late_fee_penalty || 0);

            if (classData.schedule_details) {
                const s = classData.schedule_details;
                setSelectedDays(s.days || []);
                setStartTime(s.startTime || '');
                setEndTime(s.endTime || '');
                setDuration(s.duration || 60);
                setRoom(s.room || '');
            }
        } else if (isOpen && !classData) {
            // Reset state
            setClassName(''); setSubject(''); setBatchName(''); setTeacherId('');
            setMaxStudents(40); setStartDate(''); setStatus('ACTIVE');
            setSelectedDays([]); setStartTime(''); setEndTime(''); setDuration(60); setRoom('');
            setMonthlyFee(0); setAdmissionFee(0); setLateFeePenalty(0);
        }
        setError(null);
    }, [isOpen, classData]);

    const handleDayToggle = (day) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!className || !subject) {
            setError('Class Name and Subject are required fields.');
            return;
        }

        const payload = {
            class_name: className,
            subject,
            batch_name: batchName,
            teacher_id: teacherId || null,
            max_students: parseInt(maxStudents) || 40,
            start_date: startDate || null,
            status,
            monthly_fee: parseFloat(monthlyFee) || 0,
            admission_fee: parseFloat(admissionFee) || 0,
            late_fee_penalty: parseFloat(lateFeePenalty) || 0,
            schedule_details: {
                days: selectedDays,
                startTime,
                endTime,
                duration: parseInt(duration) || 60,
                room
            }
        };

        setLoading(true);
        try {
            await onSave(payload, isEdit ? classData.id : null);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred while saving the component.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transition-colors border border-slate-200 dark:border-slate-700">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                {isEdit ? `Edit Class: ${classData.class_name}` : 'Create New Class'}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {isEdit ? 'Update existing class dynamics, capacity, and scheduling' : 'Initialize a new academic environment and schedules'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Form Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm font-medium mb-6 border border-red-200 dark:border-red-800/50 flex items-start gap-3">
                            <span className="shrink-0 font-bold mt-0.5">!</span> {error}
                        </div>
                    )}

                    <form id="class-form" onSubmit={handleSubmit} className="space-y-10">

                        {/* Section 1: Basic Information */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                                <BookOpen className="w-5 h-5 text-blue-500" /> Basic Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Class Name *</label>
                                    <input type="text" value={className} onChange={e => setClassName(e.target.value)} required placeholder="e.g. Class 10" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject *</label>
                                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required placeholder="e.g. Advanced Mathematics" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Batch Name</label>
                                    <input type="text" value={batchName} onChange={e => setBatchName(e.target.value)} placeholder="e.g. Morning Batch B" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 flex-1 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Teacher</label>
                                    <select value={teacherId} onChange={e => setTeacherId(e.target.value)} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                        <option value="">-- Unassigned --</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.first_name || t.username} {t.last_name || ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-400" /> Max Capacity</label>
                                    <input type="number" min="1" max="500" value={maxStudents} onChange={e => setMaxStudents(e.target.value)} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> Start Date</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                    <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                                        <option value="ACTIVE" className="text-emerald-600">Active</option>
                                        <option value="INACTIVE" className="text-amber-600">Inactive</option>
                                        <option value="COMPLETED" className="text-slate-600">Completed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Financial Config */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                                <DollarSign className="w-5 h-5 text-emerald-500" /> Fees Configuration
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Values are assigned dynamically to student fee plans automatically when they enroll in this specific class component.</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Monthly Fee ($)</label>
                                    <input type="number" step="0.01" min="0" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)} placeholder="0.00" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Admission/Setup Fee ($)</label>
                                    <input type="number" step="0.01" min="0" value={admissionFee} onChange={e => setAdmissionFee(e.target.value)} placeholder="0.00" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Late Fee Penalty ($)</label>
                                    <input type="number" step="0.01" min="0" value={lateFeePenalty} onChange={e => setLateFeePenalty(e.target.value)} placeholder="0.00" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Scheduling */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                                <Clock className="w-5 h-5 text-purple-500" /> Class Schedule
                            </h3>

                            <div className="mb-5">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Operating Days</label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS_OF_WEEK.map(day => {
                                        const isSelected = selectedDays.includes(day);
                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => handleDayToggle(day)}
                                                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 
                                                    ${isSelected
                                                        ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800/60 shadow-sm'
                                                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                                            >
                                                {day.substring(0, 3)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration (Mins)</label>
                                    <input type="number" min="15" step="15" value={duration} onChange={e => setDuration(e.target.value)} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Room / Location</label>
                                    <input type="text" value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. Lab 3" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex justify-end gap-3 mt-auto">
                    <button type="button" onClick={onClose} disabled={loading} className="px-6 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 font-semibold rounded-lg transition-colors disabled:opacity-50">
                        Cancel
                    </button>
                    <button type="submit" form="class-form" disabled={loading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {isEdit ? 'Update Class' : 'Create Class'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ClassModal;
