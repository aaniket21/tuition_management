import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, X, UserX, Loader2, Download, MoreVertical, Trash2, Edit, User, Eye, Search, Filter, Users, UserCheck, UserMinus, UserPlus, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, CheckSquare, Square, FileSpreadsheet, FileText, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../utils/api';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Advanced Table States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [classFilter, setClassFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Sort & Selection States
    const [sortConfig, setSortConfig] = useState({ key: 'student_code', direction: 'asc' });
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = useRef(null);

    // Close export menu on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successData, setSuccessData] = useState(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        dob: '',
        gender: '',
        address: '',
        email: '',
        parent_first_name: '',
        parent_last_name: '',
        parent_phone: '',
        admission_date: '',
        class_name: ''
    });

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/students');
            setStudents(res.data);
        } catch (err) {
            console.error('Error fetching students:', err);
            setError('Failed to load students.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const openAddModal = () => {
        setModalMode('add');
        setFormData({
            first_name: '', last_name: '', phone: '',
            dob: '', gender: '', address: '', email: '',
            admission_date: '', class_name: '',
            parent_first_name: '', parent_last_name: '', parent_phone: ''
        });
        setShowModal(true);
    };

    const openViewModal = (student) => {
        setModalMode('view');
        setSelectedStudent(student);
        setFormData(student);
        setShowModal(true);
    };

    const openEditModal = (student) => {
        setModalMode('edit');
        setSelectedStudent(student);
        setFormData({
            first_name: student.first_name,
            last_name: student.last_name,
            phone: student.phone || '',
            dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
            gender: student.gender || '',
            address: student.address || '',
            email: student.email || '',
            admission_date: student.admission_date ? new Date(student.admission_date).toISOString().split('T')[0] : '',
            class_name: student.class_name || '',
            parent_first_name: student.parent_first,
            parent_last_name: student.parent_last,
            parent_phone: student.parent_phone || ''
        });
        setShowModal(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setError(null);
        setSuccessData(null);

        try {
            if (modalMode === 'add') {
                const res = await api.post('/admin/students', formData);
                setSuccessData({ ...res.data, mode: 'add' });
            } else {
                await api.put(`/admin/students/${selectedStudent.id}`, formData);
                setSuccessData({ message: 'Student details updated successfully.', mode: 'edit' });
            }
            fetchStudents();
        } catch (err) {
            console.error('Submission error:', err);
            setError(err.response?.data?.message || 'Failed to process request.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setSubmitLoading(true);
            await api.delete(`/admin/students/${selectedStudent.id}`);
            setShowDeleteConfirm(false);
            closeModal();
            fetchStudents();
        } catch (err) {
            console.error('Deletion error:', err);
            setError('Failed to delete student.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleToggleStatus = async (student) => {
        const newStatus = student.account_status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        try {
            await api.put(`/admin/students/${student.id}/status`, { status: newStatus });
            fetchStudents();
        } catch (err) {
            console.error('Status update error:', err);
            alert('Failed to update student status.');
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedRows.size} students? This action cannot be undone.`)) return;
        try {
            await api.post('/admin/students/bulk-delete', { student_ids: Array.from(selectedRows) });
            setSelectedRows(new Set());
            fetchStudents();
        } catch (err) {
            console.error('Bulk delete error:', err);
            alert('Failed to delete students.');
        }
    };

    const handleBulkStatus = async (status) => {
        try {
            await api.put('/admin/students/bulk-status', { student_ids: Array.from(selectedRows), status });
            setSelectedRows(new Set());
            fetchStudents();
        } catch (err) {
            console.error('Bulk status error:', err);
            alert('Failed to update student statuses.');
        }
    };

    const getExportData = () => {
        return students.map(s => ({
            'Student Code': s.student_code,
            'First Name': s.first_name,
            'Last Name': s.last_name,
            'Date of Birth': s.dob ? new Date(s.dob).toLocaleDateString() : '',
            'Gender': s.gender,
            'Email': s.email,
            'Student Phone': s.phone,
            'Class': s.class_name || 'Unassigned',
            'Admission Date': s.admission_date ? new Date(s.admission_date).toLocaleDateString() : '',
            'Address': s.address,
            'Parent First Name': s.parent_first,
            'Parent Last Name': s.parent_last,
            'Parent Phone': s.parent_phone,
            'Account Status': s.account_status
        }));
    };

    const handleExportCSV = () => {
        if (students.length === 0) {
            alert("No students to export.");
            return;
        }
        const data = getExportData();
        const headers = Object.keys(data[0]).join(',');

        const escapeCSV = (val) => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const rows = data.map(obj => Object.values(obj).map(escapeCSV).join(','));
        const csvContent = [headers, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportMenu(false);
    };

    const handleExportExcel = () => {
        if (students.length === 0) {
            alert("No students to export.");
            return;
        }
        const data = getExportData();
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
        XLSX.writeFile(workbook, `Students_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
        setShowExportMenu(false);
    };

    const handleExportPDF = () => {
        if (students.length === 0) {
            alert("No students to export.");
            return;
        }
        const data = getExportData();
        const doc = new jsPDF('landscape');

        const tableColumn = Object.keys(data[0]);
        const tableRows = data.map(obj => Object.values(obj));

        doc.text("Student Management Export", 14, 15);
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [15, 118, 110] }
        });

        doc.save(`Students_Export_${new Date().toISOString().split('T')[0]}.pdf`);
        setShowExportMenu(false);
    };

    const closeModal = () => {
        setShowModal(false);
        setShowDeleteConfirm(false);
        setSuccessData(null);
        setError(null);
    };

    // --- Derived Data for Advanced Dashboard ---
    const filteredStudents = useMemo(() => {
        let filtered = students.filter(s => {
            const matchesSearch = (
                `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.student_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.phone && s.phone.includes(searchTerm))
            );
            const matchesStatus = statusFilter === 'ALL' || s.account_status === statusFilter;
            const matchesClass = classFilter === 'ALL' || (s.class_name && s.class_name === classFilter) || (classFilter === 'UNASSIGNED' && !s.class_name);
            return matchesSearch && matchesStatus && matchesClass;
        });

        filtered.sort((a, b) => {
            let valA = a[sortConfig.key] || '';
            let valB = b[sortConfig.key] || '';

            if (sortConfig.key === 'name') {
                valA = `${a.first_name} ${a.last_name}`.toLowerCase();
                valB = `${b.first_name} ${b.last_name}`.toLowerCase();
            } else if (sortConfig.key === 'parent_name') {
                valA = `${a.parent_first} ${a.parent_last}`.toLowerCase();
                valB = `${b.parent_first} ${b.parent_last}`.toLowerCase();
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [students, searchTerm, statusFilter, classFilter, sortConfig]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, classFilter]);

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredStudents.slice(start, start + itemsPerPage);
    }, [filteredStudents, currentPage, itemsPerPage]);

    const stats = useMemo(() => {
        const currentMonth = new Date().getMonth();
        return {
            total: students.length,
            active: students.filter(s => s.account_status === 'ACTIVE').length,
            inactive: students.filter(s => s.account_status === 'INACTIVE').length,
            newAdmissions: students.filter(s => s.admission_date && new Date(s.admission_date).getMonth() === currentMonth).length
        };
    }, [students]);
    // ---------------------------------------------

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
    }

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <div className="w-4"></div>;
        return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-blue-500" />;
    };

    const toggleAllRows = () => {
        if (selectedRows.size === paginatedStudents.length && paginatedStudents.length > 0) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(paginatedStudents.map(s => s.id)));
        }
    };

    const toggleRow = (id) => {
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedRows(newSet);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white dark:bg-slate-800 p-4 lg:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-200 gap-4">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-slate-100 transition-colors">Student Management</h1>
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {selectedRows.size > 0 && (
                        <div className="flex flex-wrap items-center gap-2 lg:mr-4 animate-in fade-in slide-in-from-right-4 w-full lg:w-auto p-3 lg:p-0 bg-slate-50 lg:bg-transparent dark:bg-slate-800/50 lg:dark:bg-transparent rounded-lg border border-slate-200 lg:border-none dark:border-slate-700">
                            <span className="text-sm font-medium text-slate-500 w-full lg:w-auto mb-1 lg:mb-0">{selectedRows.size} selected</span>
                            <div className="relative flex items-center bg-white border border-slate-300 rounded-lg px-2 focus-within:ring-1 focus-within:ring-blue-500 transition-all shadow-sm">
                                <select
                                    onChange={(e) => { if (e.target.value) handleBulkStatus(e.target.value); e.target.value = ''; }}
                                    className="bg-transparent border-none text-sm text-slate-700 py-1.5 focus:outline-none outline-none cursor-pointer pr-2 appearance-none font-medium"
                                    defaultValue=""
                                >
                                    <option value="" disabled>Set Status...</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                    <option value="DROPPED">Dropped</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>
                            </div>
                            <button onClick={handleBulkDelete} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg flex items-center text-sm font-medium transition-colors border border-red-200 shadow-sm">
                                <Trash2 className="w-4 h-4 mr-1.5" /> Bulk Delete
                            </button>
                        </div>
                    )}
                    {/* Export Dropdown */}
                    <div className="relative" ref={exportMenuRef}>
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors font-medium cursor-pointer"
                        >
                            <FileDown className="w-5 h-5 mr-2 text-slate-400 dark:text-slate-500" />
                            Export
                            <ChevronDown className="w-4 h-4 ml-2 text-slate-400 dark:text-slate-500" />
                        </button>

                        {showExportMenu && (
                            <div className="absolute right-0 lg:right-auto mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 transition-colors duration-200">
                                <div className="py-1">
                                    <button
                                        onClick={handleExportCSV}
                                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center transition-colors"
                                    >
                                        <FileText className="w-4 h-4 mr-3 text-slate-400 dark:text-slate-500" />
                                        Export as CSV
                                    </button>
                                    <button
                                        onClick={handleExportExcel}
                                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center transition-colors border-t border-slate-100 dark:border-slate-700"
                                    >
                                        <FileSpreadsheet className="w-4 h-4 mr-3 text-emerald-500" />
                                        Export as Excel
                                    </button>
                                    <button
                                        onClick={handleExportPDF}
                                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center transition-colors border-t border-slate-100 dark:border-slate-700"
                                    >
                                        <Download className="w-4 h-4 mr-3 text-red-500" />
                                        Export as PDF
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors cursor-pointer"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Register New Student
                    </button>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex items-center transition-colors duration-200">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4">
                        <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Students</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex items-center transition-colors duration-200">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mr-4">
                        <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Students</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.active}</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex items-center transition-colors duration-200">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-4">
                        <UserMinus className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Inactive Students</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.inactive}</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex items-center transition-colors duration-200">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-4">
                        <UserPlus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">New This Month</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.newAdmissions}</h3>
                    </div>
                </div>
            </div>

            {/* Advanced Table with Toolbar */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-200">

                {/* Search & Filter Toolbar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between transition-colors duration-200">
                    <div className="relative w-full xl:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, code, or phone..."
                            className="pl-10 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                        <div className="relative flex items-center bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 w-full sm:w-auto focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                            <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-transparent border-none text-sm w-full text-slate-700 dark:text-slate-300 focus:outline-none outline-none cursor-pointer pr-4 appearance-none"
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="DROPPED">Dropped</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>

                        <div className="relative flex items-center bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                            <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500 mr-2" />
                            <select
                                value={classFilter}
                                onChange={(e) => setClassFilter(e.target.value)}
                                className="bg-transparent border-none text-sm text-slate-700 dark:text-slate-300 focus:outline-none outline-none cursor-pointer pr-4 appearance-none"
                            >
                                <option value="ALL">All Classes</option>
                                <option value="Class 1">Class 1</option>
                                <option value="Class 2">Class 2</option>
                                <option value="Class 3">Class 3</option>
                                <option value="Class 10">Class 10</option>
                                <option value="Class 11">Class 11</option>
                                <option value="Class 12">Class 12</option>
                                <option value="UNASSIGNED">Unassigned</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm select-none transition-colors duration-200">
                                <th className="py-3 px-4 w-12 text-center">
                                    <button onClick={toggleAllRows} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        {selectedRows.size === paginatedStudents.length && paginatedStudents.length > 0 ? (
                                            <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </button>
                                </th>
                                <th className="py-3 px-4 font-semibold w-24 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('student_code')}>
                                    <div className="flex items-center justify-center gap-1">Code <SortIcon columnKey="student_code" /></div>
                                </th>
                                <th className="py-3 px-6 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">Student Name <SortIcon columnKey="name" /></div>
                                </th>
                                <th className="py-3 px-6 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('class_name')}>
                                    <div className="flex items-center gap-1">Class <SortIcon columnKey="class_name" /></div>
                                </th>
                                <th className="py-3 px-6 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors hidden md:table-cell" onClick={() => handleSort('parent_name')}>
                                    <div className="flex items-center gap-1">Parent Name <SortIcon columnKey="parent_name" /></div>
                                </th>
                                <th className="py-3 px-6 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('phone')}>
                                    <div className="flex items-center gap-1">Phone <SortIcon columnKey="phone" /></div>
                                </th>
                                <th className="py-3 px-6 font-semibold text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('account_status')}>
                                    <div className="flex justify-center items-center gap-1">Status <SortIcon columnKey="account_status" /></div>
                                </th>
                                <th className="py-3 px-6 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-slate-400 dark:text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Search className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" />
                                            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">No students found.</p>
                                            <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">Try tweaking your search or filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedStudents.map((s) => (
                                    <tr key={s.id} className={`border-b border-slate-100 dark:border-slate-700/50 transition-colors ${selectedRows.has(s.id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                                        <td className="py-4 px-4 text-center">
                                            <button onClick={() => toggleRow(s.id)} className={`text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${selectedRows.has(s.id) ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                                {selectedRows.has(s.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                            </button>
                                        </td>
                                        <td className="py-4 px-4 text-center font-medium text-slate-700 dark:text-slate-200">
                                            {s.student_code}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-slate-800 dark:text-slate-100 font-semibold">{s.first_name} {s.last_name}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Parent Ph: {s.parent_phone || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-medium">
                                            {s.class_name ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
                                                    {s.class_name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 dark:text-slate-500 text-xs italic">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300 hidden md:table-cell">{s.parent_first} {s.parent_last}</td>
                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{s.phone || '-'}</td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => handleToggleStatus(s)}
                                                className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full shadow-sm transition-all hover:scale-105 active:scale-95 ${s.account_status === 'ACTIVE' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 border border-emerald-200 dark:border-emerald-800/50'
                                                    : s.account_status === 'COMPLETED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50 border border-blue-200 dark:border-blue-800/50'
                                                        : s.account_status === 'DROPPED' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50 border border-red-200 dark:border-red-800/50'
                                                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50 border border-amber-200 dark:border-amber-800/50'
                                                    }`}
                                                title={`Click to change status`}
                                            >
                                                {s.account_status}
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openViewModal(s)}
                                                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="View Profile"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(s)}
                                                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                    title="Edit Student"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
                                                            try {
                                                                await api.delete(`/admin/students/${s.id}`);
                                                                fetchStudents();
                                                            } catch (err) {
                                                                console.error('Deletion error:', err);
                                                                alert('Failed to delete student.');
                                                            }
                                                        }
                                                    }}
                                                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete Student"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-4 lg:px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row gap-4 items-center justify-between transition-colors duration-200">
                        <div className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-left">
                            Showing <span className="font-medium text-slate-800 dark:text-slate-200">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium text-slate-800 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> of <span className="font-medium text-slate-800 dark:text-slate-200">{filteredStudents.length}</span> students
                        </div>
                        <div className="flex flex-wrap justify-center bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 overflow-hidden transition-colors duration-200 max-w-full">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed border-r border-slate-200 dark:border-slate-600 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" /> Prev
                            </button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3.5 py-1.5 text-sm font-medium border-r border-slate-200 dark:border-slate-600 last:border-r-0 transition-colors ${currentPage === i + 1 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Registration/Success Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 sm:p-4 transition-opacity duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-none sm:rounded-2xl shadow-xl w-full h-full sm:h-auto sm:max-h-[90vh] max-w-3xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200 transition-colors">
                        {successData ? (
                            <div className="p-8 text-center">
                                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                                    {successData.mode === 'add' ? 'Registration Successful!' : 'Update Successful!'}
                                </h2>

                                {successData.mode === 'add' ? (
                                    <>
                                        <p className="text-slate-500 dark:text-slate-400 mb-8">Please securely share these credentials with the student and their parent.</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-8">
                                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-5 rounded-xl">
                                                <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-3 border-b border-blue-200 dark:border-blue-800/50 pb-2">Student Credentials</h3>
                                                <p className="text-blue-900 dark:text-blue-200 mb-1"><span className="font-semibold w-24 inline-block">Username:</span> {successData.student_credentials?.username}</p>
                                                <p className="text-blue-900 dark:text-blue-200"><span className="font-semibold w-24 inline-block">Password:</span> {successData.student_credentials?.password}</p>
                                                <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 p-2 rounded">Role: STUDENT</div>
                                            </div>
                                            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/50 p-5 rounded-xl">
                                                <h3 className="font-bold text-purple-800 dark:text-purple-300 mb-3 border-b border-purple-200 dark:border-purple-800/50 pb-2">Parent Credentials</h3>
                                                <p className="text-purple-900 dark:text-purple-200 mb-1"><span className="font-semibold w-24 inline-block">Username:</span> {successData.parent_credentials?.username}</p>
                                                <p className="text-purple-900 dark:text-purple-200"><span className="font-semibold w-24 inline-block">Password:</span> {successData.parent_credentials?.password}</p>
                                                <div className="mt-3 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 p-2 rounded">Role: PARENT</div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-slate-500 dark:text-slate-400 mb-8">{successData.message}</p>
                                )}

                                <button onClick={closeModal} className="w-full bg-slate-900 dark:bg-slate-700 text-white py-3 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors">
                                    Done
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Document Style Header Banner */}
                                <div className="relative overflow-hidden bg-[#1e293b] text-white p-8">
                                    <div className="absolute top-0 right-0 w-64 h-full transform translate-x-12 -skew-x-12 bg-[#0f766e]"></div>
                                    <div className="absolute top-0 right-0 w-32 h-full transform translate-x-8 -skew-x-12 bg-[#14b8a6] opacity-50"></div>

                                    <div className="relative z-10 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white flex flex-wrap p-1">
                                                <div className="w-1/2 h-1/2 bg-black"></div>
                                                <div className="w-1/2 h-1/2 bg-white"></div>
                                                <div className="w-1/2 h-1/2 bg-white"></div>
                                                <div className="w-1/2 h-1/2 bg-black"></div>
                                            </div>
                                            <div>
                                                <h1 className="text-xl font-bold tracking-wider">EDUCATION.</h1>
                                                <p className="text-xs text-[#14b8a6] tracking-widest">TUITION MANAGEMENT SYSTEM</p>
                                            </div>
                                        </div>
                                        <button onClick={closeModal} className="text-white hover:text-slate-300 transition-colors p-2 z-20 absolute top-2 right-2">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                {modalMode === 'view' ? (
                                    <div className="p-8 md:p-12 space-y-10">
                                        <div className="flex flex-col md:flex-row gap-8 items-start">
                                            {/* Profile Banner */}
                                            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 border-4 border-white dark:border-slate-800 shadow-lg shrink-0 flex items-center justify-center">
                                                {formData.photo_url ? (
                                                    <img src={formData.photo_url} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-12 h-12 text-slate-300 dark:text-slate-500" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{formData.first_name} {formData.last_name}</h2>
                                                <div className="flex flex-wrap gap-4 mt-3">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                                                        Code: {formData.student_code}
                                                    </span>
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                                        Class: {formData.class_name || 'Unassigned'}
                                                    </span>
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${formData.account_status === 'ACTIVE' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'}`}>
                                                        Status: {formData.account_status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Student Details */}
                                            <div className="space-y-6">
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                                                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Student Information
                                                </h3>
                                                <div className="grid grid-cols-2 gap-y-4 text-sm">
                                                    <div className="text-slate-500 dark:text-slate-400">Gender</div>
                                                    <div className="font-medium text-slate-800 dark:text-slate-200">{formData.gender || '-'}</div>

                                                    <div className="text-slate-500 dark:text-slate-400">Date of Birth</div>
                                                    <div className="font-medium text-slate-800 dark:text-slate-200">{formData.dob ? new Date(formData.dob).toLocaleDateString() : '-'}</div>

                                                    <div className="text-slate-500 dark:text-slate-400">Phone</div>
                                                    <div className="font-medium text-slate-800 dark:text-slate-200">{formData.phone || '-'}</div>

                                                    <div className="text-slate-500 dark:text-slate-400">Email</div>
                                                    <div className="font-medium text-slate-800 dark:text-slate-200">{formData.email || '-'}</div>

                                                    <div className="text-slate-500 dark:text-slate-400">Admission Date</div>
                                                    <div className="font-medium text-slate-800 dark:text-slate-200">{formData.admission_date ? new Date(formData.admission_date).toLocaleDateString() : '-'}</div>
                                                </div>
                                            </div>

                                            {/* Parent Details */}
                                            <div className="space-y-6">
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                                                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Guardian Information
                                                </h3>
                                                <div className="grid grid-cols-2 gap-y-4 text-sm">
                                                    <div className="text-slate-500 dark:text-slate-400">Parent Name</div>
                                                    <div className="font-medium text-slate-800 dark:text-slate-200">{formData.parent_first} {formData.parent_last}</div>

                                                    <div className="text-slate-500 dark:text-slate-400">Parent Phone</div>
                                                    <div className="font-medium text-slate-800 dark:text-slate-200">{formData.parent_phone}</div>

                                                    <div className="text-slate-500 dark:text-slate-400">Address</div>
                                                    <div className="font-medium text-slate-800 dark:text-slate-200">{formData.address || '-'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="p-4 sm:p-8 md:p-12 bg-white dark:bg-slate-800 transition-colors duration-200 min-h-screen sm:min-h-0 flex flex-col">
                                        {error && (
                                            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-sm text-sm mb-6 border-l-4 border-red-500">
                                                {error}
                                            </div>
                                        )}

                                        {/* Document Title Area */}
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 sm:mb-10 border-b border-gray-200 dark:border-slate-700 pb-6 sm:pb-8 gap-4 sm:gap-0">
                                            <div className="max-w-md w-full">
                                                <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-slate-100 mb-2">
                                                    Registration <span className="text-[#0f766e] dark:text-[#14b8a6]">Form</span>
                                                </h2>
                                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                                    {modalMode === 'add'
                                                        ? 'Please fill out all required fields to register a new student and generate their portal credentials.'
                                                        : `Editing details for student record: ${selectedStudent?.student_code}`
                                                    }
                                                    {modalMode === 'edit' && <span className="block mt-1 text-red-500 dark:text-red-400 font-medium">Warning: Editing parent phone number will invalidate their current password.</span>}
                                                </p>
                                            </div>
                                            <div className="w-full md:w-auto md:text-right mt-2 md:mt-0 flex justify-end">
                                                <div className="inline-block">
                                                    <label className="block text-[10px] sm:text-xs font-bold text-gray-800 dark:text-slate-300 uppercase tracking-wider mb-1 text-right">DATE OF REGISTRATION</label>
                                                    <div className="flex items-center gap-1 sm:gap-2 justify-end">
                                                        <div className="w-8 h-8 border border-gray-300 dark:border-slate-600 flex items-center justify-center text-sm dark:text-slate-200">{new Date().getDate().toString().padStart(2, '0')[0]}</div>
                                                        <div className="w-8 h-8 border border-gray-300 dark:border-slate-600 flex items-center justify-center text-sm dark:text-slate-200">{new Date().getDate().toString().padStart(2, '0')[1]}</div>
                                                        <span className="text-gray-400 dark:text-slate-500">/</span>
                                                        <div className="w-8 h-8 border border-gray-300 dark:border-slate-600 flex items-center justify-center text-sm dark:text-slate-200">{(new Date().getMonth() + 1).toString().padStart(2, '0')[0]}</div>
                                                        <div className="w-8 h-8 border border-gray-300 dark:border-slate-600 flex items-center justify-center text-sm dark:text-slate-200">{(new Date().getMonth() + 1).toString().padStart(2, '0')[1]}</div>
                                                        <span className="text-gray-400 dark:text-slate-500">/</span>
                                                        <div className="w-8 h-8 border border-gray-300 dark:border-slate-600 flex items-center justify-center text-sm dark:text-slate-200">{new Date().getFullYear().toString().slice(2)[0]}</div>
                                                        <div className="w-8 h-8 border border-gray-300 dark:border-slate-600 flex items-center justify-center text-sm dark:text-slate-200">{new Date().getFullYear().toString().slice(2)[1]}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-10">
                                            {/* SECTION 1: STUDENT */}
                                            <div>
                                                <div className="mb-6 relative">
                                                    <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider inline-block bg-white dark:bg-slate-800 pr-4 relative z-10">
                                                        STUDENT INFORMATION
                                                    </h3>
                                                    <div className="absolute left-0 bottom-1 w-full h-[2px] bg-gray-200 dark:bg-slate-700"></div>
                                                    <div className="absolute left-0 bottom-1 w-[220px] h-[2px] bg-[#0f766e] dark:bg-[#14b8a6] z-20"></div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                                    {/* Full Name mapped to First + Last for DB */}
                                                    <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row items-baseline gap-4">
                                                        <label className="w-full md:w-32 text-sm font-bold text-gray-700 dark:text-slate-300">Full Name :</label>
                                                        <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                                                            <input required type="text" name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-transparent dark:text-slate-100 focus:outline-none focus:border-[#0f766e] dark:focus:border-[#14b8a6] transition-colors" />
                                                            <input required type="text" name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-transparent dark:text-slate-100 focus:outline-none focus:border-[#0f766e] dark:focus:border-[#14b8a6] transition-colors" />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col md:flex-row items-baseline gap-4">
                                                        <label className="w-full md:w-32 text-sm font-bold text-gray-700 dark:text-slate-300">Date of Birth :</label>
                                                        <input type="date" name="dob" max={new Date().toISOString().split('T')[0]} value={formData.dob} onChange={handleChange} className="flex-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-transparent dark:text-slate-100 focus:outline-none focus:border-[#0f766e] dark:focus:border-[#14b8a6] transition-colors" />
                                                    </div>

                                                    <div className="flex flex-col md:flex-row items-baseline gap-4">
                                                        <label className="w-full md:w-32 text-sm font-bold text-gray-700 dark:text-slate-300">Email :</label>
                                                        <input type="email" name="email" placeholder="student@example.com" value={formData.email} onChange={handleChange} className="flex-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-transparent dark:text-slate-100 focus:outline-none focus:border-[#0f766e] dark:focus:border-[#14b8a6] transition-colors" />
                                                    </div>

                                                    <div className="flex flex-col md:flex-row items-baseline gap-4">
                                                        <label className="w-full md:w-32 text-sm font-bold text-gray-700 dark:text-slate-300">Phone :</label>
                                                        <input type="text" name="phone" placeholder="(Optional)" value={formData.phone} onChange={handleChange} className="flex-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-transparent dark:text-slate-100 focus:outline-none focus:border-[#0f766e] dark:focus:border-[#14b8a6] transition-colors" />
                                                    </div>

                                                    <div className="flex flex-col md:flex-row items-baseline gap-4">
                                                        <label className="w-full md:w-32 text-sm font-bold text-gray-700 dark:text-slate-300">Gender :</label>
                                                        <div className="flex-1 flex gap-6 mt-2 md:mt-0 text-slate-800 dark:text-slate-200">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={handleChange} className="w-4 h-4 text-[#0f766e] dark:text-[#14b8a6] focus:ring-[#0f766e] dark:focus:ring-[#14b8a6]" /> <span className="text-sm">Male</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={handleChange} className="w-4 h-4 text-[#0f766e] dark:text-[#14b8a6] focus:ring-[#0f766e] dark:focus:ring-[#14b8a6]" /> <span className="text-sm">Female</span>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col md:flex-row items-baseline gap-4">
                                                        <label className="w-full md:w-32 text-sm font-bold text-gray-700 dark:text-slate-300">Class :</label>
                                                        <select name="class_name" value={formData.class_name} onChange={handleChange} className="flex-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0f766e] dark:focus:border-[#14b8a6] transition-colors">
                                                            <option value="">Select Class</option>
                                                            <option value="Class 1">Class 1</option>
                                                            <option value="Class 2">Class 2</option>
                                                            <option value="Class 3">Class 3</option>
                                                            <option value="Class 4">Class 4</option>
                                                            <option value="Class 5">Class 5</option>
                                                            <option value="Class 6">Class 6</option>
                                                            <option value="Class 7">Class 7</option>
                                                            <option value="Class 8">Class 8</option>
                                                            <option value="Class 9">Class 9</option>
                                                            <option value="Class 10">Class 10</option>
                                                            <option value="Class 11">Class 11</option>
                                                            <option value="Class 12">Class 12</option>
                                                        </select>
                                                    </div>

                                                    <div className="flex flex-col md:flex-row items-baseline gap-4">
                                                        <label className="w-full md:w-32 text-sm font-bold text-gray-700 dark:text-slate-300">Admission :</label>
                                                        <input type="date" name="admission_date" value={formData.admission_date} onChange={handleChange} className="flex-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-transparent dark:text-slate-100 focus:outline-none focus:border-[#0f766e] dark:focus:border-[#14b8a6] transition-colors" />
                                                    </div>

                                                    <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row items-baseline gap-4">
                                                        <label className="w-full md:w-32 text-sm font-bold text-gray-700 dark:text-slate-300 mt-2 md:mt-0">Address :</label>
                                                        <textarea name="address" placeholder="Full residential address" value={formData.address} onChange={handleChange} rows="2" className="flex-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-transparent dark:text-slate-100 focus:outline-none focus:border-[#0f766e] dark:focus:border-[#14b8a6] transition-colors resize-none"></textarea>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* SECTION 2: PARENT */}
                                            <div>
                                                <div className="mb-6 relative">
                                                    <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider inline-block bg-white dark:bg-slate-800 pr-4 relative z-10">
                                                        PARENT/GUARDIAN DETAILS
                                                    </h3>
                                                    <div className="absolute left-0 bottom-1 w-full h-[2px] bg-gray-200 dark:bg-slate-700"></div>
                                                    <div className="absolute left-0 bottom-1 w-[260px] h-[2px] bg-[#0f766e] dark:bg-[#14b8a6] z-20"></div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                                    <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row items-baseline gap-4">
                                                        <label className="w-full md:w-32 text-sm font-bold text-gray-700 dark:text-slate-300">Full Name :</label>
                                                        <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                                                            <input required type="text" name="parent_first_name" placeholder="First Name" value={formData.parent_first_name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-transparent dark:text-slate-100 focus:outline-none focus:border-[#0f766e] dark:focus:border-[#14b8a6] transition-colors" />
                                                            <input required type="text" name="parent_last_name" placeholder="Last Name" value={formData.parent_last_name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-transparent dark:text-slate-100 focus:outline-none focus:border-[#0f766e] dark:focus:border-[#14b8a6] transition-colors" />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col md:flex-row items-baseline gap-4">
                                                        <label className="w-full md:w-32 text-sm font-bold text-gray-700 dark:text-slate-300">Phone :</label>
                                                        <div className="flex-1 w-full">
                                                            <input required type="text" name="parent_phone" placeholder="Required for Login" value={formData.parent_phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-transparent dark:text-slate-100 focus:outline-none focus:border-[#0f766e] dark:focus:border-[#14b8a6] transition-colors" />
                                                            {modalMode === 'add' && (
                                                                <p className="text-xs text-[#0f766e] dark:text-[#14b8a6] mt-1 font-medium">Used as initial password.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto sm:mt-16 pt-8 border-t-2 border-[#0f766e] dark:border-[#14b8a6] flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-4 sm:pb-0">
                                            <div className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 w-full md:w-auto">
                                                <h4 className="font-bold text-[#0f766e] dark:text-[#14b8a6] uppercase tracking-wider mb-2">ADDRESS SCHOOL:</h4>
                                                <p className="flex items-center gap-2"><span className="font-bold text-slate-800 dark:text-slate-200">A:</span> 123 Education St., Knowledge City, 12345</p>
                                                <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                                                    <span className="flex items-center gap-2"><span className="font-bold text-slate-800 dark:text-slate-200">P:</span> +1-234-567-8900</span>
                                                    <span className="hidden sm:inline-block ml-2"></span>
                                                    <span className="flex items-center gap-2"><span className="font-bold text-slate-800 dark:text-slate-200">E:</span> register@school.edu</span>
                                                </p>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center w-full md:w-auto justify-end">
                                                {modalMode === 'edit' && showDeleteConfirm ? (
                                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-red-50 dark:bg-red-900/30 p-3 rounded border border-red-200 dark:border-red-800/50 w-full sm:w-auto">
                                                        <span className="text-sm text-red-700 dark:text-red-400 font-medium text-center sm:text-left mb-2 sm:mb-0">Are you sure?</span>
                                                        <div className="flex gap-2">
                                                            <button type="button" onClick={() => setShowDeleteConfirm(false)} className="flex-1 sm:flex-none px-3 py-2 sm:py-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-sm text-slate-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 rounded transition-colors">Cancel</button>
                                                            <button type="button" onClick={handleDelete} className="flex-1 sm:flex-none px-3 py-2 sm:py-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white text-sm rounded transition-colors whitespace-nowrap">Confirm Delete</button>
                                                        </div>
                                                    </div>
                                                ) : modalMode === 'edit' && !showDeleteConfirm ? (
                                                    <button type="button" onClick={() => setShowDeleteConfirm(true)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-bold uppercase tracking-wider flex items-center gap-1 transition-colors">
                                                        <Trash2 className="w-4 h-4" /> DELETE RECORD
                                                    </button>
                                                ) : null}

                                                <button
                                                    type="submit"
                                                    disabled={submitLoading}
                                                    className="border-b-2 border-transparent hover:border-[#0f766e] dark:hover:border-[#14b8a6] pb-1 text-[#0f766e] dark:text-[#14b8a6] font-bold uppercase tracking-wider hover:text-[#0d645d] dark:hover:text-[#00ccb1] transition-all flex items-center gap-2"
                                                >
                                                    {submitLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> PROCESSING...</> : (modalMode === 'add' ? 'SUBMIT REGISTRATION' : 'SAVE CHANGES')}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentManagement;
