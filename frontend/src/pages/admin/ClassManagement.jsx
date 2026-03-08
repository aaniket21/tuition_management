import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Filter, BookOpen, Users, Clock, Edit2,
    Trash2, Eye, Download, ChevronRight, AlertCircle
} from 'lucide-react';
import api from '../../utils/api';
import ClassModal from './ClassModal';

const ClassManagement = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtering and Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [teacherFilter, setTeacherFilter] = useState('');

    // Modal state
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);

    useEffect(() => {
        fetchData();
        fetchTeachers();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (statusFilter) params.append('status', statusFilter);
            if (teacherFilter) params.append('teacher_id', teacherFilter);

            const response = await api.get(`/admin/classes?${params.toString()}`);
            setClasses(response.data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            // Usually teachers role is distinct, but for now we fetch all users or logic from dashboard
            const response = await api.get('/admin/users'); // Assuming we have such endpoint or similar
            // Filtering for TEACHER or ADMIN roles locally if backend sends all
            // For now let's just use what we have
            const t = response.data.filter(u => u.role === 'TEACHER' || u.role === 'ADMIN');
            setTeachers(t);
        } catch (error) {
            console.error('Error fetching teachers:', error);
        }
    };

    // Apply search/filters locally if backend doesn't support deep search yet (though we built it)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500); // Debounce
        return () => clearTimeout(timer);
    }, [searchQuery, statusFilter, teacherFilter]);

    const handleCreateClass = () => {
        setEditingClass(null);
        setIsClassModalOpen(true);
    };

    const handleEditClass = (c) => {
        setEditingClass(c);
        setIsClassModalOpen(true);
    };

    const handleDeleteClass = async (id) => {
        if (!window.confirm('Are you sure you want to delete this class? This will also remove student enrollments safely.')) return;
        try {
            await api.delete(`/admin/classes/${id}`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting class');
        }
    };

    const handleSaveClass = async (payload, id) => {
        try {
            if (id) {
                await api.put(`/admin/classes/${id}`, payload);
                alert('Class updated successfully!');
            } else {
                await api.post('/admin/classes', payload);
                alert('Class created successfully!');
            }
            fetchData();
        } catch (error) {
            console.error('Error saving class:', error);
            // Alert user so they can see why it failed (e.g., duplicate name)
            alert(error.response?.data?.message || 'Error saving class');
        }
    };

    const handleExportCSV = () => {
        if (classes.length === 0) {
            alert("No data available to export.");
            return;
        }

        const headers = ["Class Name", "Subject", "Batch", "Teacher", "Current Students", "Max Capacity", "Status"];
        const csvRows = [headers.join(',')];

        classes.forEach(c => {
            const row = [
                `"${c.class_name}"`,
                `"${c.subject}"`,
                `"${c.batch_name || ''}"`,
                `"${c.teacher_name || 'Unassigned'}"`,
                c.current_students,
                c.max_students,
                c.status
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.hidden = true;
        a.href = url;
        a.download = `classes_export_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const formatSchedule = (details) => {
        if (!details || !details.days || details.days.length === 0) return 'TBA';
        const daysStr = details.days.map(d => d.substring(0, 3)).join(', ');
        const timeStr = details.startTime && details.endTime ? `${details.startTime} - ${details.endTime}` : '';
        return `${daysStr} ${timeStr}`;
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
            case 'INACTIVE': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50';
            case 'COMPLETED': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto align-top">

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                        Class Management
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 sm:mt-2 font-medium">
                        Configure modules, allocate batches, and establish learning schedules.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button onClick={handleExportCSV} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm font-semibold text-sm">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button onClick={handleCreateClass} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm shadow-blue-600/20 font-semibold text-sm">
                        <Plus className="w-5 h-5" /> Create Class
                    </button>
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search class names, subjects, or teachers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative">
                        <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-9 pr-8 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium w-full sm:w-40"
                        >
                            <option value="">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>
                    <div className="relative">
                        <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            value={teacherFilter}
                            onChange={(e) => setTeacherFilter(e.target.value)}
                            className="pl-9 pr-8 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium w-full sm:w-48"
                        >
                            <option value="">All Teachers</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.first_name || t.username}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Class Cards Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : classes.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
                    <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No Classes Found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                        Your search didn't match any existing classes, or none have been assigned to your academy yet.
                    </p>
                    <button onClick={handleCreateClass} className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 transition-colors font-semibold">
                        <Plus className="w-4 h-4" /> Initialize First Class
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map(c => (
                        <div key={c.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col group">

                            {/* Card Header Context */}
                            <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-start relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                                <div className="z-10 bg-white/50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border uppercase ${getStatusStyle(c.status)}`}>
                                            {c.status}
                                        </span>
                                        {c.batch_name && (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 uppercase">
                                                {c.batch_name}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate" title={c.class_name}>
                                        {c.class_name}
                                    </h3>
                                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5 truncate uppercase tracking-wide">
                                        {c.subject}
                                    </p>
                                </div>
                                <button onClick={() => navigate(`/admin/classes/${c.id}`)} className="z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-600 transition-colors">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Card Data Content */}
                            <div className="p-5 flex-1 flex flex-col gap-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                        <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Teacher</div>
                                        <div className="text-slate-800 dark:text-slate-200 font-medium truncate">
                                            {c.teacher_name || <span className="text-amber-500 italic flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Unassigned</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                                        <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Schedule</div>
                                        <div className="text-slate-800 dark:text-slate-200 font-medium truncate line-clamp-1" title={formatSchedule(c.schedule_details)}>
                                            {formatSchedule(c.schedule_details)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Analytics / Progress Bar */}
                            <div className="px-5 pb-5">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Enrollment Capacity</span>
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{c.current_students} / {c.max_students}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${(parseInt(c.current_students) / c.max_students) >= 0.9
                                            ? 'bg-red-500' // Near capacity
                                            : 'bg-emerald-500'
                                            }`}
                                        style={{ width: `${Math.min((parseInt(c.current_students) / c.max_students) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="p-3 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/80 flex flex-wrap gap-2 justify-end">
                                <button
                                    onClick={() => handleEditClass(c)}
                                    className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800/50"
                                >
                                    <Edit2 className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                    onClick={() => navigate(`/admin/classes/${c.id}`)}
                                    className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/50"
                                >
                                    <Eye className="w-3.5 h-3.5" /> View
                                </button>
                                <button
                                    onClick={() => handleDeleteClass(c.id)}
                                    className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/50"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            <ClassModal
                isOpen={isClassModalOpen}
                onClose={() => setIsClassModalOpen(false)}
                classData={editingClass}
                onSave={handleSaveClass}
                teachers={teachers}
            />
        </div>
    );
};

export default ClassManagement;
