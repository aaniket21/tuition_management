import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Users, UserPlus, Clock, Calendar,
    BookOpen, DollarSign, Activity, Settings,
    Trash2, Edit, AlertCircle, TrendingUp, Download
} from 'lucide-react';
import api from '../../utils/api';
import AddStudentToClassModal from '../../components/shared/AddStudentToClassModal';
import BulkMoveModal from '../../components/shared/BulkMoveModal';

const ClassDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [classData, setClassData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Tab Navigation
    const [activeTab, setActiveTab] = useState('students');

    // Modals
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [isBulkMoveOpen, setIsBulkMoveOpen] = useState(false);

    useEffect(() => {
        fetchClassData();
    }, [id]);

    const fetchClassData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/admin/classes/${id}`);
            setClassData(response.data);
        } catch (err) {
            console.error('Error fetching class details:', err);
            setError('Failed to load class data. It may have been deleted.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveStudent = async (studentId) => {
        if (!window.confirm('Are you sure you want to remove this student from the class?')) return;
        try {
            await api.delete(`/admin/classes/${id}/students/${studentId}`);
            fetchClassData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error removing student');
        }
    };

    const formatSchedule = (details) => {
        if (!details || !details.days || details.days.length === 0) return 'TBA';
        const days = details.days.join(', ');
        return `${days} • ${details.startTime || '--:--'} to ${details.endTime || '--:--'} (${details.duration || 60}m)`;
    };

    if (loading) return (
        <div className="flex justify-center items-center py-20 min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error || !classData) return (
        <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-2xl mx-auto shadow-sm mt-8">
            <AlertCircle className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Error Loading Class</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
            <button onClick={() => navigate('/admin/classes')} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
                Back to Classes
            </button>
        </div>
    );

    const { students = [], analytics = {} } = classData;
    const capacityRatio = classData.max_students ? (students.length / classData.max_students) * 100 : 0;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto align-top">
            {/* Top Navigation */}
            <button onClick={() => navigate('/admin/classes')} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors w-max pb-2">
                <ArrowLeft className="w-4 h-4" /> Back to Directory
            </button>

            {/* Header Dashboard Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8 justify-between relative z-10">
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 uppercase">
                                {classData.status}
                            </span>
                            {classData.batch_name && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 uppercase">
                                    Batch {classData.batch_name}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-2">
                            {classData.class_name}
                        </h1>
                        <p className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-6 uppercase tracking-wide">
                            {classData.subject}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                            <div className="flex items-start gap-3">
                                <Users className="w-5 h-5 text-slate-400 mt-0.5" />
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teacher</div>
                                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{classData.teacher_full_name || 'Unassigned'}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Schedule</div>
                                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">{formatSchedule(classData.schedule_details)}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <BookOpen className="w-5 h-5 text-slate-400 mt-0.5" />
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Room Location</div>
                                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{classData.schedule_details?.room || 'TBA'}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</div>
                                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                        {classData.start_date ? new Date(classData.start_date).toLocaleDateString() : 'Immediate'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-blue-500" /> Key Metrics
                                </h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                        <span>Capacity</span>
                                        <span>{students.length} / {classData.max_students || 40}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${capacityRatio > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                                            style={{ width: `${Math.min(capacityRatio, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-tight">Collected</div>
                                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">${analytics.totalFeesCollected || 0}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800/20">
                            <div className="flex justify-between items-center text-sm font-semibold text-blue-800 dark:text-blue-300">
                                <span>Monthly Fee:</span>
                                <span>${classData.monthly_fee || '0.00'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabbed Interface */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 hide-scrollbar bg-slate-50 dark:bg-slate-800/50">
                    {[
                        { id: 'students', icon: Users, label: 'Enrolled Students', count: students.length },
                        { id: 'settings', icon: Settings, label: 'Class Configuration' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-colors whitespace-nowrap outline-none ${activeTab === tab.id
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-800'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700/50 border-b-2 border-transparent'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-0">

                    {/* Students Tab */}
                    {activeTab === 'students' && (
                        <div>
                            <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                    Manage student assignments within this environment. Students inherit this class's fee configurations upon entry.
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={() => setIsBulkMoveOpen(true)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors font-semibold text-sm border border-slate-200 dark:border-slate-600"
                                    >
                                        Bulk Move
                                    </button>
                                    <button
                                        onClick={() => setIsAddStudentOpen(true)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm shadow-blue-600/20 font-semibold text-sm"
                                    >
                                        <UserPlus className="w-4 h-4" /> Enroll Student
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-700">
                                {students.length === 0 ? (
                                    <div className="text-center py-12 px-4 text-slate-500">
                                        No students are currently enrolled in this class.
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
                                            <tr>
                                                <th className="px-6 py-4">Student</th>
                                                <th className="px-6 py-4">Student Code</th>
                                                <th className="px-6 py-4">Phone</th>
                                                <th className="px-6 py-4">Parent Info</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                                            {students.map(s => (
                                                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-800 dark:text-slate-200">{s.first_name} {s.last_name}</div>
                                                        <div className="text-xs text-slate-500">{s.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded uppercase tracking-wider text-xs border border-slate-200 dark:border-slate-600 font-medium">
                                                            {s.student_code}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{s.phone || '-'}</td>
                                                    <td className="px-6 py-4">
                                                        {s.parent_first ? (
                                                            <>
                                                                <div className="text-slate-800 dark:text-slate-300 font-medium">{s.parent_first} {s.parent_last}</div>
                                                                <div className="text-xs text-slate-500">{s.parent_phone}</div>
                                                            </>
                                                        ) : (
                                                            <span className="text-slate-400 italic">Unassigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleRemoveStudent(s.id)}
                                                            className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/40 p-2 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/50"
                                                            title="Remove from class"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="p-8">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">Financial Matrix</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                                <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                    <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Monthly Tuition Base</div>
                                    <div className="text-2xl font-black text-slate-800 dark:text-slate-100">${classData.monthly_fee || '0.00'}</div>
                                </div>
                                <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                    <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Registration/Admission</div>
                                    <div className="text-2xl font-black text-slate-800 dark:text-slate-100">${classData.admission_fee || '0.00'}</div>
                                </div>
                                <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-red-50 dark:bg-red-900/10">
                                    <div className="text-sm font-semibold text-red-500 dark:text-red-400 mb-1">Late Penalty Rule</div>
                                    <div className="text-2xl font-black text-red-700 dark:text-red-300">${classData.late_fee_penalty || '0.00'}</div>
                                </div>
                            </div>
                            <div className="text-sm text-slate-500">Use the global Class Management portal to edit these settings utilizing the core settings modal structure.</div>
                        </div>
                    )}

                </div>
            </div>

            {/* Render Modals */}
            <AddStudentToClassModal
                isOpen={isAddStudentOpen}
                onClose={() => setIsAddStudentOpen(false)}
                classId={classData.id}
                className={classData.class_name}
                onSave={fetchClassData}
            />

            <BulkMoveModal
                isOpen={isBulkMoveOpen}
                onClose={() => setIsBulkMoveOpen(false)}
                sourceClassId={classData.id}
                sourceClassName={classData.class_name}
                onSave={fetchClassData}
            />

        </div>
    );
};

export default ClassDetails;
