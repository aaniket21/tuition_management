import { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Users, AlertCircle, CheckSquare, Square } from 'lucide-react';
import api from '../../utils/api';

const BulkMoveModal = ({ isOpen, onClose, sourceClassId, sourceClassName, onSave }) => {
    const [students, setStudents] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [targetClasses, setTargetClasses] = useState([]);
    const [selectedTargetClass, setSelectedTargetClass] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && sourceClassId) {
            fetchData();
        } else {
            // Reset
            setStudents([]);
            setSelectedIds(new Set());
            setSelectedTargetClass('');
        }
    }, [isOpen, sourceClassId]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch students in this class
            const classRes = await api.get(`/admin/classes/${sourceClassId}`);
            setStudents(classRes.data.students || []);

            // Fetch all other classes for target dropdown
            const classesRes = await api.get('/admin/classes');
            // Filter out the source class and COMPLETED classes
            const targets = classesRes.data.filter(c => c.id !== sourceClassId && c.status !== 'COMPLETED');
            setTargetClasses(targets);
        } catch (err) {
            console.error('Error fetching data for bulk move:', err);
            setError('Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStudent = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedIds.size === students.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(students.map(s => s.id)));
        }
    };

    const handleMove = async () => {
        if (selectedIds.size === 0) {
            setError('Please select at least one student to move.');
            return;
        }
        if (!selectedTargetClass) {
            setError('Please select a target class.');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await api.post('/admin/classes/bulk/move', {
                studentIds: Array.from(selectedIds),
                sourceClassId,
                targetClassId: selectedTargetClass
            });

            if (onSave) onSave(); // Refresh parent
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to move students.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden transition-colors border border-slate-200 dark:border-slate-700">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <ArrowRightLeft className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                Bulk Move Students
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                Source: <span className="text-orange-600 dark:text-orange-400">{sourceClassName}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 md:flex-row">

                    {/* Left: Student Selection */}
                    <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col overflow-hidden">
                        <div className="bg-slate-100 dark:bg-slate-700/50 p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Select Students</span>
                            </div>
                            <button
                                onClick={handleSelectAll}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                                {selectedIds.size === students.length && students.length > 0 ? (
                                    <><CheckSquare className="w-4 h-4" /> Deselect All</>
                                ) : (
                                    <><Square className="w-4 h-4" /> Select All</>
                                )}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 bg-slate-50/30 dark:bg-slate-800/30 max-h-80 md:max-h-none">
                            {loading ? (
                                <div className="text-center py-8 text-sm text-slate-500">Loading...</div>
                            ) : students.length === 0 ? (
                                <div className="text-center py-8 text-sm text-slate-500 italic">No students in this class.</div>
                            ) : (
                                <div className="space-y-1">
                                    {students.map(s => (
                                        <label key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedIds.has(s.id)
                                            ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800/50'
                                            : 'bg-white border-transparent hover:border-slate-200 dark:bg-slate-800 dark:hover:border-slate-700'
                                            }`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(s.id)}
                                                onChange={() => handleToggleStudent(s.id)}
                                                className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                                                    {s.first_name} {s.last_name}
                                                </span>
                                                <span className="text-xs text-slate-500 uppercase tracking-wide">
                                                    {s.student_code}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Target Selection */}
                    <div className="w-full md:w-64 flex flex-col gap-4">
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/40 rounded-xl p-4">
                            <h3 className="text-sm font-bold text-orange-800 dark:text-orange-300 flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4" /> Target Class
                            </h3>
                            <p className="text-xs text-orange-700/80 dark:text-orange-300/80 mb-4 leading-relaxed">
                                Selected students will be removed from <span className="font-semibold">{sourceClassName}</span> and enrolled into the target class. Fees configuration of the target class will apply to their future billing.
                            </p>

                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Move to:</label>
                            <select
                                value={selectedTargetClass}
                                onChange={e => setSelectedTargetClass(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                            >
                                <option value="">-- Select Target Class --</option>
                                {targetClasses.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.class_name} ({c.subject})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {error && (
                            <div className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
                                {error}
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {selectedIds.size} student{selectedIds.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} disabled={saving} className="px-5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleMove}
                            disabled={selectedIds.size === 0 || !selectedTargetClass || saving}
                            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed dark:disabled:bg-slate-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                        >
                            {saving ? 'Moving...' : 'Move Students'}
                            {!saving && <ArrowRightLeft className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkMoveModal;
