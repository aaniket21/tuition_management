import { useState, useEffect } from 'react';
import { X, Search, Check, UserPlus } from 'lucide-react';
import api from '../../utils/api';

const AddStudentToClassModal = ({ isOpen, onClose, classId, className, onSave }) => {
    const [allStudents, setAllStudents] = useState([]);
    const [enrolledStudentIds, setEnrolledStudentIds] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && classId) {
            fetchData();
        }
    }, [isOpen, classId]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // First fetch all students in the system
            const studentsRes = await api.get('/admin/students');
            setAllStudents(studentsRes.data);

            // Then fetch the class details to know who is already enrolled
            const classRes = await api.get(`/admin/classes/${classId}`);
            const enrolled = new Set(classRes.data.students.map(s => s.id));
            setEnrolledStudentIds(enrolled);
        } catch (err) {
            console.error('Error fetching data for modal:', err);
            setError('Failed to load student data.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStudent = async (studentId) => {
        if (enrolledStudentIds.has(studentId) || saving) return;

        setSaving(true);
        setError(null);
        try {
            // Check if capacity permits (done via backend)
            await api.post(`/admin/classes/${classId}/students`, { student_id: studentId });

            // Mark as enrolled locally
            setEnrolledStudentIds(prev => new Set([...prev, studentId]));

            if (onSave) onSave(); // trigger parent refresh so stats update
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to enroll student.');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveStudent = async (studentId) => {
        if (!enrolledStudentIds.has(studentId) || saving) return;

        setSaving(true);
        setError(null);
        try {
            await api.delete(`/admin/classes/${classId}/students/${studentId}`);

            // Unmark locally
            setEnrolledStudentIds(prev => {
                const next = new Set(prev);
                next.delete(studentId);
                return next;
            });

            if (onSave) onSave(); // trigger parent refresh
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove student.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const filteredStudents = allStudents.filter(s => {
        const query = searchQuery.toLowerCase();
        return (
            (s.first_name + ' ' + s.last_name).toLowerCase().includes(query) ||
            s.student_code.toLowerCase().includes(query) ||
            (s.phone && s.phone.includes(query))
        );
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden transition-colors border border-slate-200 dark:border-slate-700">

                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                Assign Students to <span className="text-indigo-600 dark:text-indigo-400">{className}</span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Search and click to toggle enrollment. Changes are saved instantly.
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by student name, code, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                    {error && (
                        <div className="mt-3 text-red-500 dark:text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50 dark:bg-slate-800/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                            Loading students...
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 text-sm italic">
                            No students match your search.
                        </div>
                    ) : (
                        <div className="space-y-1 p-2">
                            {filteredStudents.map(student => {
                                const isEnrolled = enrolledStudentIds.has(student.id);
                                return (
                                    <div
                                        key={student.id}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${isEnrolled
                                            ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-800/50'
                                            : 'bg-white border-transparent hover:border-slate-200 dark:bg-slate-800 dark:hover:border-slate-700 shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex flex-col items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600">
                                                {student.photo_url ? (
                                                    <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">
                                                        {student.first_name[0]}{student.last_name[0]}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                                    {student.first_name} {student.last_name}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                    <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] tracking-wider uppercase border border-slate-200 dark:border-slate-600">
                                                        {student.student_code}
                                                    </span>
                                                    {student.class_name && <span>• {student.class_name}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => isEnrolled ? handleRemoveStudent(student.id) : handleAddStudent(student.id)}
                                            disabled={saving}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${isEnrolled
                                                ? 'bg-indigo-100 text-indigo-700 hover:bg-red-100 hover:text-red-700 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-red-900/40 dark:hover:text-red-400'
                                                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 shadow-sm'
                                                }`}
                                        >
                                            {isEnrolled ? (
                                                <>
                                                    <Check className="w-3.5 h-3.5" /> Enrolled
                                                </>
                                            ) : (
                                                'Add to Class'
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors text-sm">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddStudentToClassModal;
