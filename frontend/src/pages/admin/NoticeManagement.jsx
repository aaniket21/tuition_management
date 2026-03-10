import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, Search, Filter, Edit, Trash2, Eye, Pin, Paperclip, Bell, Calendar, X, AlertCircle } from 'lucide-react';

const CATEGORIES = ['GENERAL', 'HOLIDAY', 'EXAM', 'FEE'];
const TARGET_TYPES = ['ALL_STUDENTS', 'CLASS', 'BATCH', 'STUDENT'];

const SearchableSelect = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const selectedOption = options.find(o => o.id === value);

    useEffect(() => {
        if (selectedOption && !isOpen) {
            setSearch(selectedOption.label);
        }
    }, [value, selectedOption, isOpen]);

    const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="relative">
            <input
                type="text"
                placeholder={placeholder}
                value={isOpen ? search : (selectedOption ? selectedOption.label : search)}
                onChange={(e) => {
                    setSearch(e.target.value);
                    if (!isOpen) setIsOpen(true);
                    if (e.target.value === '') onChange('');
                }}
                onFocus={() => {
                    setIsOpen(true);
                    setSearch(''); // Clear search on focus
                }}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                        <div
                            key={opt.id}
                            className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-800 dark:text-slate-200 transition-colors"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onChange(opt.id);
                                setIsOpen(false);
                                setSearch(opt.label);
                            }}
                        >
                            {opt.label}
                        </div>
                    )) : (
                        <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">No results found</div>
                    )}
                </div>
            )}
        </div>
    );
};

const NoticeManagement = () => {
    const [notices, setNotices] = useState([]);
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [targetFilter, setTargetFilter] = useState('ALL');
    const [showExpired, setShowExpired] = useState(false);

    // Modals
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedNotice, setSelectedNotice] = useState(null);
    const [editingNotice, setEditingNotice] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'GENERAL',
        target_type: 'ALL_STUDENTS',
        target_id: '',
        is_pinned: false,
        expiry_date: '',
        attachment_url: ''
    });

    useEffect(() => {
        fetchData();
    }, [categoryFilter, targetFilter, showExpired]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [noticesRes, classesRes, studentsRes] = await Promise.all([
                api.get(`/admin/notices`, {
                    params: {
                        category: categoryFilter,
                        target_type: targetFilter,
                        include_expired: showExpired
                    }
                }),
                api.get('/admin/classes'),
                api.get('/admin/students')
            ]);
            setNotices(noticesRes.data);
            setClasses(classesRes.data);
            setStudents(studentsRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenForm = (notice = null) => {
        if (notice) {
            setEditingNotice(notice);
            setFormData({
                title: notice.title,
                content: notice.content,
                category: notice.category || 'GENERAL',
                target_type: notice.target_type || 'ALL_STUDENTS',
                target_id: notice.target_id || '',
                is_pinned: notice.is_pinned || false,
                expiry_date: notice.expiry_date ? notice.expiry_date.split('T')[0] : '',
                attachment_url: notice.attachment_url || ''
            });
        } else {
            setEditingNotice(null);
            setFormData({
                title: '',
                content: '',
                category: 'GENERAL',
                target_type: 'ALL_STUDENTS',
                target_id: '',
                is_pinned: false,
                expiry_date: '',
                attachment_url: ''
            });
        }
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (!payload.target_id) delete payload.target_id;
            if (!payload.expiry_date) delete payload.expiry_date;

            if (editingNotice) {
                await api.put(`/admin/notices/${editingNotice.id}`, payload);
            } else {
                await api.post('/admin/notices', payload);
            }
            setIsFormOpen(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving notice');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this notice?")) {
            try {
                await api.delete(`/admin/notices/${id}`);
                fetchData();
            } catch (error) {
                alert('Failed to delete notice');
            }
        }
    };

    const getTargetDisplay = (type, targetId) => {
        if (type === 'ALL_STUDENTS') return 'Global (All)';
        if (type === 'CLASS' && targetId) {
            const cls = classes.find(c => c.id === targetId);
            return cls ? `Class: ${cls.subject}` : 'Specific Class';
        }
        if (type === 'BATCH' && targetId) {
            const cls = classes.find(c => c.id === targetId);
            return cls ? `Batch: ${cls.batch_name || cls.class_name}` : 'Specific Batch';
        }
        if (type === 'STUDENT' && targetId) {
            const stu = students.find(s => s.id === targetId);
            return stu ? `Student: ${stu.first_name} ${stu.last_name}` : 'Specific Student';
        }
        return type.replace('_', ' ');
    };

    const filteredNotices = notices.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pinnedNotices = filteredNotices.filter(n => n.is_pinned);
    const standardNotices = filteredNotices.filter(n => !n.is_pinned);

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="text-center md:text-left">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center md:justify-start">
                        <Bell className="w-6 h-6 mr-3 text-blue-600 dark:text-blue-400" />
                        Notice Board
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Broadcast announcements to students and parents</p>
                </div>
                <button
                    onClick={() => handleOpenForm()}
                    className="flex justify-center items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm w-full md:w-auto mt-4 md:mt-0"
                >
                    <Plus className="w-4 h-4 mr-2" /> Create Notice
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-full md:min-w-[200px] relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search notices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-700 dark:text-slate-300 w-full sm:w-auto min-w-[120px]"
                >
                    <option value="ALL">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                    value={targetFilter}
                    onChange={e => setTargetFilter(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-700 dark:text-slate-300 w-full md:w-auto min-w-[120px]"
                >
                    <option value="ALL">All Audiences</option>
                    {TARGET_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
                <label className="flex items-center space-x-2 text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showExpired}
                        onChange={e => setShowExpired(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span>Show Expired</span>
                </label>
            </div>

            {/* Notice List */}
            {loading ? (
                <div className="h-40 flex items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                </div>
            ) : filteredNotices.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="w-16 h-16 mx-auto bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mb-4">
                        <Bell className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">No Notices Found</h3>
                    <p className="text-slate-500 dark:text-slate-400">There are no notices matching your current filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {/* Render Pinned First */}
                    {pinnedNotices.map(notice => (
                        <NoticeCard key={notice.id} notice={notice} isPinned={true} onEdit={() => handleOpenForm(notice)} onDelete={() => handleDelete(notice.id)} onView={() => { setSelectedNotice(notice); setIsViewOpen(true); }} getTargetDisplay={getTargetDisplay} />
                    ))}
                    {/* Standard Next */}
                    {standardNotices.map(notice => (
                        <NoticeCard key={notice.id} notice={notice} isPinned={false} onEdit={() => handleOpenForm(notice)} onDelete={() => handleDelete(notice.id)} onView={() => { setSelectedNotice(notice); setIsViewOpen(true); }} getTargetDisplay={getTargetDisplay} />
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 p-6 flex justify-between items-center z-10">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{editingNotice ? 'Edit Notice' : 'Draft New Notice'}</h2>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Notice Title *</label>
                                <input
                                    type="text" required
                                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-slate-100"
                                    placeholder="e.g. Upcoming Holiday Notification"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                    <select
                                        value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-slate-100"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Audience</label>
                                    <select
                                        value={formData.target_type} onChange={e => setFormData({ ...formData, target_type: e.target.value, target_id: '' })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-slate-100"
                                    >
                                        {TARGET_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                                    </select>
                                </div>
                            </div>

                            {formData.target_type === 'CLASS' && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Class *</label>
                                    <select
                                        required value={formData.target_id} onChange={e => setFormData({ ...formData, target_id: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-slate-100"
                                    >
                                        <option value="">-- Select Class --</option>
                                        {Object.entries(classes.reduce((acc, c) => {
                                            const key = c.class_name || 'Unassigned';
                                            if (!acc[key]) acc[key] = [];
                                            acc[key].push(c);
                                            return acc;
                                        }, {})).map(([className, classList]) => (
                                            <optgroup key={className} label={`Standard/Class: ${className}`}>
                                                {classList.map(c => <option key={c.id} value={c.id}>{c.subject}</option>)}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {(formData.target_type === 'BATCH' || formData.target_type === 'STUDENT') && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Select {formData.target_type} *</label>
                                    <SearchableSelect
                                        options={
                                            formData.target_type === 'STUDENT'
                                                ? students.map(s => ({ id: s.id, label: `${s.first_name} ${s.last_name} (${s.student_code})` }))
                                                : classes.map(c => ({ id: c.id, label: `${c.batch_name || c.class_name} - ${c.subject}` }))
                                        }
                                        value={formData.target_id}
                                        onChange={(val) => setFormData({ ...formData, target_id: val })}
                                        placeholder={`Search for a ${formData.target_type}...`}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Notice Message *</label>
                                <textarea
                                    required rows={5}
                                    value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none text-slate-800 dark:text-slate-100"
                                    placeholder="Write your notice content here..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Expiry Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-slate-100"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Notice will hide automatically after this date.</p>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <label className="flex items-center space-x-3 cursor-pointer mt-5">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_pinned} onChange={e => setFormData({ ...formData, is_pinned: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Pin to Top</span>
                                            <span className="block text-xs text-slate-500 dark:text-slate-400">Notice stays at the very top of lists</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Attachment URL (Optional)</label>
                                <div className="relative">
                                    <Paperclip className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="url"
                                        value={formData.attachment_url} onChange={e => setFormData({ ...formData, attachment_url: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-slate-100"
                                        placeholder="https://example.com/syllabus.pdf"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-xl transition-colors shadow-sm">
                                    {editingNotice ? 'Save Changes' : 'Broadcast Notice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Full View Modal */}
            {isViewOpen && selectedNotice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
                        <div className={`p-6 border-b ${selectedNotice.is_pinned ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-700/50' : 'bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    {selectedNotice.is_pinned && <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />}
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${selectedNotice.category === 'HOLIDAY' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                                        selectedNotice.category === 'EXAM' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' :
                                            selectedNotice.category === 'FEE' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}>
                                        {selectedNotice.category}
                                    </span>
                                    <span className="text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                                        To: {getTargetDisplay(selectedNotice.target_type, selectedNotice.target_id)}
                                    </span>
                                </div>
                                <button onClick={() => setIsViewOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{selectedNotice.title}</h2>
                            <div className="flex items-center gap-4 mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <div className="flex items-center">
                                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                    {new Date(selectedNotice.created_at).toLocaleDateString()}
                                </div>
                                {selectedNotice.created_by_name && (
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 mr-1.5 flex items-center justify-center overflow-hidden">
                                            <svg className="w-3 h-3 text-slate-500 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                        </div>
                                        {selectedNotice.created_by_name}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed text-[15px]">
                                {selectedNotice.content}
                            </div>

                            {selectedNotice.attachment_url && (
                                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center text-blue-800 dark:text-blue-300">
                                        <Paperclip className="w-5 h-5 mr-3 text-blue-500 dark:text-blue-400" />
                                        <div>
                                            <p className="text-sm font-semibold">Attached Document</p>
                                            <a href={selectedNotice.attachment_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                                                {selectedNotice.attachment_url.length > 50 ? selectedNotice.attachment_url.substring(0, 50) + '...' : selectedNotice.attachment_url}
                                            </a>
                                        </div>
                                    </div>
                                    <a href={selectedNotice.attachment_url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white text-blue-600 text-sm font-medium rounded-lg shadow-sm hover:shadow transition-shadow">
                                        Open File
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Subcomponent for Notice row block
const NoticeCard = ({ notice, isPinned, onEdit, onDelete, onView, getTargetDisplay }) => {
    const isExpired = notice.expiry_date && new Date(notice.expiry_date) < new Date();

    return (
        <div className={`p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer flex flex-col md:flex-row gap-4 items-start md:items-center ${isPinned ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700/50 shadow-sm' : isExpired ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'} `}>
            <div className="flex-shrink-0 mt-1 md:mt-0" onClick={onView}>
                {isPinned ? (
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
                        <Pin className="w-5 h-5 fill-amber-500 dark:fill-amber-400" />
                    </div>
                ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notice.category === 'HOLIDAY' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                        notice.category === 'EXAM' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' :
                            notice.category === 'FEE' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                        }`}>
                        <Bell className="w-5 h-5" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0" onClick={onView}>
                <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-base font-bold truncate ${isExpired ? 'text-slate-500 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                        {notice.title}
                    </h3>
                    {isExpired && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded uppercase whitespace-nowrap">Expired</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 md:mt-0">
                    <span className={`px-2 py-0.5 rounded-md ${notice.category === 'HOLIDAY' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                        notice.category === 'EXAM' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' :
                            notice.category === 'FEE' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                                'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                        }`}>
                        {notice.category}
                    </span>
                    <span className="flex items-center whitespace-nowrap">
                        <User className="w-3 h-3 mr-1" />
                        {getTargetDisplay(notice.target_type, notice.target_id)}
                    </span>
                    <span className="flex items-center whitespace-nowrap">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(notice.created_at).toLocaleDateString()}
                    </span>
                    {notice.attachment_url && (
                        <span className="flex items-center text-blue-500 dark:text-blue-400"><Paperclip className="w-3 h-3 ml-1" /></span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-slate-100 dark:border-slate-700">
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="flex-1 md:flex-none justify-center flex items-center px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="flex-1 md:flex-none justify-center flex items-center px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                </button>
            </div>
        </div>
    );
};
import { User } from 'lucide-react';

export default NoticeManagement;
