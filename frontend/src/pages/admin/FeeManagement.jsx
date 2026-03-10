import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { CreditCard, Plus, IndianRupee, Banknote, Printer, Search, TrendingUp, AlertCircle, User, Edit, X, Download, FileSpreadsheet, FileText, Trash2, Save } from 'lucide-react';
import ReceiptModal from '../../components/admin/ReceiptModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TABS = [
    { id: 'collection', label: 'Collection Point', icon: <CreditCard className="w-4 h-4 mr-2" /> },
    { id: 'pending', label: 'Pending tracker', icon: <AlertCircle className="w-4 h-4 mr-2" /> },
    { id: 'structures', label: 'Structure Setup', icon: <Plus className="w-4 h-4 mr-2" /> },
    { id: 'reports', label: 'Reports', icon: <TrendingUp className="w-4 h-4 mr-2" /> }
];

const FeeManagement = () => {
    const [activeTab, setActiveTab] = useState('collection');

    // Data states
    const [structures, setStructures] = useState([]);
    const [studentFees, setStudentFees] = useState([]);
    const [classes, setClasses] = useState([]);
    const [reports, setReports] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [classFilter, setClassFilter] = useState('ALL');
    const [monthFilter, setMonthFilter] = useState('ALL');

    const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
    const [isEditStructureModalOpen, setIsEditStructureModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isAdvancePaymentModalOpen, setIsAdvancePaymentModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const [editingPaymentId, setEditingPaymentId] = useState(null);
    const [editPaymentForm, setEditPaymentForm] = useState({});

    const [receiptData, setReceiptData] = useState(null);
    const [selectedFee, setSelectedFee] = useState(null);
    const [selectedStructure, setSelectedStructure] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [structRes, feeRes, classRes, repRes, studentRes] = await Promise.all([
                api.get('/admin/fees/structures'),
                api.get('/admin/fees/students'),
                api.get('/admin/classes'),
                api.get('/admin/fees/reports'),
                api.get('/admin/students')
            ]);
            setStructures(structRes.data);
            setStudentFees(feeRes.data);
            setClasses(classRes.data);
            setReports(repRes.data);
            setStudents(studentRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateStructure = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData.entries());
        try {
            await api.post('/admin/fees/structures', payload);
            alert('Structure created successfully!');
            setIsStructureModalOpen(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating structure');
        }
    };

    const handleUpdateStructure = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData.entries());
        try {
            await api.put(`/admin/fees/structures/${selectedStructure.id}`, payload);
            alert('Structure updated successfully!');
            setIsEditStructureModalOpen(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating structure');
        }
    };

    const handleCollectPayment = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const amount_paid = formData.get('amount_paid');
        const payment_mode = formData.get('payment_mode');

        try {
            const res = await api.post('/admin/fees/collect', {
                student_fee_id: selectedFee.id,
                student_id: selectedFee.student_id, // Pass student_id for advanced multi-month processing
                amount_paid,
                payment_mode
            });
            alert('Payment recorded successfully!');
            setIsPaymentModalOpen(false);
            if (res.data.receipt_id) {
                // Could open receipt automatically, but for now just refresh
            }
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error recording payment');
        }
    };



    const handleViewProfile = async (fee) => {
        try {
            setSelectedFee(fee);
            setIsProfileModalOpen(true);
            const historyRes = await api.get(`/admin/fees/students/${fee.id}/payments`);
            setPaymentHistory(historyRes.data);
        } catch (error) {
            console.error(error);
            alert('Failed to load payment history.');
        }
    };

    const handleAdvancePayment = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            const res = await api.post('/admin/fees/collect', {
                student_id: formData.get('student_id'),
                amount_paid: formData.get('amount_paid'),
                payment_mode: formData.get('payment_mode')
            });
            alert('Advance Payment recorded successfully!');
            setIsAdvancePaymentModalOpen(false);
            if (res.data.receipt_id) {
                // optional receipt popup
            }
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error recording advance payment');
        }
    };

    const handleUpdatePaymentSubmit = async (paymentId) => {
        try {
            await api.put(`/admin/fees/payments/${paymentId}`, {
                amount_paid: editPaymentForm.amount_paid,
                payment_mode: editPaymentForm.payment_mode,
                date: editPaymentForm.date
            });
            alert('Payment updated successfully');
            setEditingPaymentId(null);

            // Refetch this single profile's payments to update UI immediately
            const historyRes = await api.get(`/admin/fees/students/${selectedFee.id}/payments`);
            setPaymentHistory(historyRes.data);

            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating payment');
        }
    };

    const handleDeletePayment = async (paymentId) => {
        if (!window.confirm("Are you sure you want to delete this payment record? The student's fee ledger will be recalculated immediately.")) return;
        try {
            await api.delete(`/admin/fees/payments/${paymentId}`);
            alert('Payment deleted successfully!');

            // Refresh payment history explicitly
            const historyRes = await api.get(`/admin/fees/students/${selectedFee.id}/payments`);
            setPaymentHistory(historyRes.data);

            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting payment');
        }
    };

    const handleUpdateFee = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            await api.put(`/admin/fees/students/${selectedFee.id}`, {
                amount: formData.get('amount'),
                discount: formData.get('discount')
            });
            alert('Fee profile updated successfully!');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating fee');
        }
    };

    // Derived Data
    const uniqueMonths = [...new Set(studentFees.map(f => f.month))].filter(Boolean);
    const uniqueClasses = [...new Set(studentFees.map(f => f.class_name))].filter(Boolean);

    const filteredFees = studentFees.filter(fee => {
        const str = `${fee.first_name} ${fee.last_name} ${fee.student_code}`.toLowerCase();
        const matchesSearch = str.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || fee.status === statusFilter;
        const matchesClass = classFilter === 'ALL' || fee.class_name === classFilter;
        const matchesMonth = monthFilter === 'ALL' || fee.month === monthFilter;
        return matchesSearch && matchesStatus && matchesClass && matchesMonth;
    });

    const pendingFees = studentFees.filter(f => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID' || f.status === 'OVERDUE');

    const getReportExportData = () => {
        return studentFees.map(fee => ({
            'Student Name': `${fee.first_name} ${fee.last_name}`,
            'Code': fee.student_code,
            'Class': fee.class_name,
            'Month': fee.month,
            'Total Bill': (fee.amount - fee.discount).toFixed(2),
            'Amount Paid': parseFloat(fee.total_paid || 0).toFixed(2),
            'Balance Due': ((fee.amount - fee.discount) - parseFloat(fee.total_paid || 0)).toFixed(2),
            'Status': fee.status.replace('_', ' ')
        }));
    };

    const handleExportPDF = () => {
        const data = getReportExportData();
        if (data.length === 0) return alert('No data to export.');

        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Tuition Center Fee Report", 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        const tableColumn = Object.keys(data[0]);
        const tableRows = data.map(obj => Object.values(obj));

        autoTable(doc, {
            startY: 35,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255] } // Teal-700
        });

        doc.save(`Fee_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleExportExcel = () => {
        const data = getReportExportData();
        if (data.length === 0) return alert('No data to export.');
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Fee Report");
        XLSX.writeFile(workbook, `Fee_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (loading && studentFees.length === 0) return <div className="p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Fee Processing</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage structures, collect payments, and track receivables</p>
                </div>
                <div className="flex flex-wrap bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-200 dark:border-slate-700">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-1 md:flex-none justify-center items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* TAB CONTENT: Collection Point */}
            {activeTab === 'collection' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row justify-between items-start xl:items-center bg-slate-50 dark:bg-slate-900/50 gap-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Student Fee Profiles</h2>
                            <button onClick={() => setIsAdvancePaymentModalOpen(true)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded shadow-sm transition-colors flex items-center whitespace-nowrap">
                                <Banknote className="w-3 h-3 mr-1" /> Advance Payment
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                            <div className="relative flex-1 md:flex-none md:w-64">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                <input type="text" placeholder="Search student..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500" />
                            </div>
                            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="flex-1 md:flex-none px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                <option value="ALL">All Months</option>
                                {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="flex-1 md:flex-none px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                <option value="ALL">All Classes</option>
                                {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex-1 md:flex-none px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                <option value="ALL">All Status</option>
                                <option value="PAID">Paid</option>
                                <option value="PARTIALLY_PAID">Partially Paid</option>
                                <option value="UNPAID">Unpaid</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                                    <th className="p-4 font-medium">Student Info</th>
                                    <th className="p-4 font-medium">Class / Month</th>
                                    <th className="p-4 font-medium">Total Bill</th>
                                    <th className="p-4 font-medium">Paid</th>
                                    <th className="p-4 font-medium flex justify-center">Status</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFees.map(fee => {
                                    const billed = fee.amount - (fee.discount || 0);
                                    const paid = parseFloat(fee.total_paid || 0);
                                    const balance = billed - paid;
                                    return (
                                        <tr key={fee.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-semibold text-slate-800 dark:text-slate-200">{fee.first_name} {fee.last_name}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">{fee.student_code}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{fee.class_name || 'Unassigned'}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">{fee.month}</div>
                                            </td>
                                            <td className="p-4 text-sm font-semibold text-slate-800 dark:text-slate-200">₹{billed.toFixed(2)}</td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">₹{paid.toFixed(2)}</span>
                                                    {balance > 0 && <span className="text-[10px] text-red-500 dark:text-red-400 font-bold uppercase tracking-wider mt-0.5">Due: ₹{balance.toFixed(2)}</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full ${fee.status === 'PAID' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                                                    fee.status === 'PARTIALLY_PAID' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                    }`}>
                                                    {fee.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <button onClick={() => handleViewProfile(fee)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded transition-colors" title="Edit Financial Profile">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    {fee.status !== 'PAID' && (
                                                        <button onClick={() => { setSelectedFee(fee); setIsPaymentModalOpen(true); }} className="px-3 py-1.5 bg-blue-600 text-white rounded font-medium text-xs hover:bg-blue-700 transition-colors flex items-center shadow-sm">
                                                            <Banknote className="w-3 h-3 mr-1" /> Collect
                                                        </button>
                                                    )}
                                                    <button onClick={() => setReceiptData(fee)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors" title="Print latest statement">
                                                        <Printer className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredFees.length === 0 && (
                                    <tr><td colSpan="6" className="p-8 text-center text-slate-500 font-medium">No fee profiles matching your criteria.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: Structure Setup */}
            {activeTab === 'structures' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button onClick={() => setIsStructureModalOpen(true)} className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors">
                            <Plus className="w-4 h-4 mr-2" /> New Fee Structure
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {structures.map(struct => (
                            <div key={struct.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><IndianRupee className="w-16 h-16" /></div>
                                <h3 className="text-xl font-bold text-slate-800">{struct.class_name}</h3>
                                <p className="text-sm font-medium text-blue-600 mb-4">{struct.payment_cycle.replace('_', ' ')} cycle</p>

                                <div className="space-y-2 flex-grow text-sm text-slate-600">
                                    <div className="flex justify-between"><span className="text-slate-400">Monthly Tuition:</span> <span className="font-semibold text-slate-800">₹{struct.monthly_fee}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Admission Fee:</span> <span className="font-semibold text-slate-800">₹{struct.admission_fee}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Registration Fee:</span> <span className="font-semibold text-slate-800">₹{struct.registration_fee}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Exam Fee:</span> <span className="font-semibold text-slate-800">₹{struct.exam_fee}</span></div>
                                </div>

                                <button onClick={() => { setSelectedStructure(struct); setIsEditStructureModalOpen(true); }} className="mt-6 w-full py-2 flex justify-center items-center bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg transition-colors border border-slate-200">
                                    <Edit className="w-4 h-4 mr-2" /> Edit Structure
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: Pending Tracker */}
            {activeTab === 'pending' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-red-200 dark:border-red-900/50 overflow-hidden">
                    <div className="p-6 border-b border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-red-900 dark:text-red-400 flex items-center">
                                <AlertCircle className="w-5 h-5 mr-2 text-red-500 dark:text-red-400" /> Action Required: Overdue Accounts
                            </h2>
                            <p className="text-red-700 dark:text-red-300 text-sm mt-1">Students listed here have unpaid balances.</p>
                        </div>
                        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
                            Send Bulk Reminders
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                                    <th className="p-4 font-medium">Student</th>
                                    <th className="p-4 font-medium">Class</th>
                                    <th className="p-4 font-medium">Pending Amount</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingFees.map(fee => {
                                    const amountOwed = (parseFloat(fee.amount) - parseFloat(fee.discount)) - parseFloat(fee.total_paid || 0);
                                    return (
                                        <tr key={fee.id} className="border-b border-slate-100">
                                            <td className="p-4 font-medium text-slate-800">{fee.first_name} {fee.last_name}</td>
                                            <td className="p-4 text-slate-600">{fee.class_name} - {fee.month}</td>
                                            <td className="p-4 font-bold text-red-600">₹{amountOwed.toFixed(2)}</td>
                                            <td className="p-4 text-xs font-semibold text-red-500">{fee.status.replace('_', ' ')}</td>
                                            <td className="p-4">
                                                <button onClick={() => { setSelectedFee(fee); setIsPaymentModalOpen(true); }} className="text-blue-600 hover:underline text-sm font-medium">Collect Now</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: Reports */}
            {activeTab === 'reports' && reports && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Financial Overview</h2>
                        <div className="flex gap-2">
                            <button onClick={handleExportPDF} className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors shadow-sm">
                                <FileText className="w-4 h-4 mr-2 text-red-500 dark:text-red-400" /> Export PDF
                            </button>
                            <button onClick={handleExportExcel} className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors shadow-sm">
                                <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500 dark:text-emerald-400" /> Export Excel
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl text-white shadow-md">
                            <h3 className="text-emerald-100 font-medium mb-1">Total Received (This Month)</h3>
                            <div className="text-4xl font-bold flex items-center">₹{reports.totalReceivedMonth.toFixed(2)}</div>
                        </div>
                        <div className="bg-gradient-to-br from-red-500 to-pink-600 p-6 rounded-2xl text-white shadow-md">
                            <h3 className="text-red-100 font-medium mb-1">Total Pending System-Wide</h3>
                            <div className="text-4xl font-bold flex items-center">₹{reports.totalPending.toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800">Comprehensive Fee Ledger</h3>
                            <span className="text-xs font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">{studentFees.length} Records</span>
                        </div>
                        <div className="overflow-y-auto max-h-[500px]">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="sticky top-0 bg-white shadow-sm z-10">
                                    <tr className="border-b border-slate-200 text-slate-500">
                                        <th className="p-4 font-medium">Student</th>
                                        <th className="p-4 font-medium">Class/Month</th>
                                        <th className="p-4 font-medium">Billed</th>
                                        <th className="p-4 font-medium">Paid</th>
                                        <th className="p-4 font-medium">Balance</th>
                                        <th className="p-4 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {studentFees.map(fee => {
                                        const billed = fee.amount - (fee.discount || 0);
                                        const paid = parseFloat(fee.total_paid || 0);
                                        const balance = billed - paid;
                                        return (
                                            <tr key={fee.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-semibold text-slate-800">{fee.first_name} {fee.last_name}</div>
                                                    <div className="text-xs text-slate-500">{fee.student_code}</div>
                                                </td>
                                                <td className="p-4 text-slate-600">{fee.class_name} <br /> <span className="text-xs">{fee.month}</span></td>
                                                <td className="p-4 font-medium text-slate-700">₹{billed.toFixed(2)}</td>
                                                <td className="p-4 font-medium text-emerald-600">₹{paid.toFixed(2)}</td>
                                                <td className="p-4 font-bold text-slate-800">
                                                    {balance > 0 ? <span className="text-red-600">₹{balance.toFixed(2)}</span> : <span className="text-slate-400">₹0.00</span>}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${fee.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                                        fee.status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {fee.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}


            {/* Modals */}
            {isStructureModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">Create Fee Structure</h2>
                            <button onClick={() => setIsStructureModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                        </div>
                        <form onSubmit={handleCreateStructure} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
                                    <select name="class_id" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="">-- select a class --</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.class_name} {c.batch_name ? `(${c.batch_name})` : ''}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Fee (₹)</label>
                                    <input type="number" step="0.01" name="monthly_fee" required className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Admission Fee (₹)</label>
                                    <input type="number" step="0.01" name="admission_fee" defaultValue={0} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Registration Fee (₹)</label>
                                    <input type="number" step="0.01" name="registration_fee" defaultValue={0} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Exam Fee (₹)</label>
                                    <input type="number" step="0.01" name="exam_fee" defaultValue={0} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Late Fine Amount (₹)</label>
                                    <input type="number" step="0.01" name="late_fine_amount" defaultValue={0} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Cycle</label>
                                    <select name="payment_cycle" className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500">
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="QUARTERLY">Quarterly</option>
                                        <option value="ONE_TIME">One Time</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsStructureModalOpen(false)} className="px-5 py-2 font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                                <button type="submit" className="px-5 py-2 font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Save Structure</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditStructureModalOpen && selectedStructure && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">Edit Fee Structure - {selectedStructure.class_name}</h2>
                            <button onClick={() => setIsEditStructureModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleUpdateStructure} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Fee (₹)</label>
                                    <input type="number" step="0.01" name="monthly_fee" required defaultValue={selectedStructure.monthly_fee} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Admission Fee (₹)</label>
                                    <input type="number" step="0.01" name="admission_fee" defaultValue={selectedStructure.admission_fee} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Registration Fee (₹)</label>
                                    <input type="number" step="0.01" name="registration_fee" defaultValue={selectedStructure.registration_fee} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Exam Fee (₹)</label>
                                    <input type="number" step="0.01" name="exam_fee" defaultValue={selectedStructure.exam_fee} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Late Fine Amount (₹)</label>
                                    <input type="number" step="0.01" name="late_fine_amount" defaultValue={selectedStructure.late_fine_amount} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Cycle</label>
                                    <select name="payment_cycle" defaultValue={selectedStructure.payment_cycle} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500">
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="QUARTERLY">Quarterly</option>
                                        <option value="ONE_TIME">One Time</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsEditStructureModalOpen(false)} className="px-5 py-2 font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                                <button type="submit" className="px-5 py-2 font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Update Structure</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPaymentModalOpen && selectedFee && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-blue-50 dark:bg-blue-900/30">
                            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200">Collect Payment</h2>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">×</button>
                        </div>
                        <form onSubmit={handleCollectPayment} className="p-6">
                            <div className="mb-6 space-y-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-4 border border-slate-100">
                                <div className="flex justify-between"><span>Student:</span> <span className="font-semibold text-slate-800">{selectedFee.first_name} {selectedFee.last_name}</span></div>
                                <div className="flex justify-between"><span>Month:</span> <span className="font-semibold text-slate-800">{selectedFee.month}</span></div>
                                <div className="flex justify-between"><span>Total Bill:</span> <span className="font-semibold text-slate-800">₹{(selectedFee.amount - selectedFee.discount).toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Already Paid:</span> <span className="font-semibold text-emerald-600">₹{parseFloat(selectedFee.total_paid || 0).toFixed(2)}</span></div>
                                <hr className="my-2 border-slate-200" />
                                <div className="flex justify-between text-red-600 font-bold">
                                    <span>Remaining Balance:</span>
                                    <span>₹{((selectedFee.amount - selectedFee.discount) - parseFloat(selectedFee.total_paid || 0)).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount Paying Now (₹)</label>
                                    <input type="number" step="0.01" name="amount_paid" required defaultValue={((selectedFee.amount - selectedFee.discount) - parseFloat(selectedFee.total_paid || 0)).toFixed(2)} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold text-lg text-emerald-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
                                    <select name="payment_mode" className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500">
                                        <option value="CASH">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors text-lg flex justify-center items-center">
                                <IndianRupee className="w-5 h-5 mr-1" /> Record Payment
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isProfileModalOpen && selectedFee && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center"><User className="mr-2 w-5 h-5 text-blue-600" /> Student Financial Profile</h2>
                            <button onClick={() => setIsProfileModalOpen(false)} className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto w-full">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Student</p>
                                    <p className="font-bold text-slate-800 dark:text-slate-100">{selectedFee.first_name} {selectedFee.last_name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedFee.student_code}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Fee Plan</p>
                                    <p className="font-bold text-slate-800 dark:text-slate-100">{selectedFee.class_name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedFee.month}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Ledger Status</p>
                                    <span className={`inline-flex px-2 py-1 text-xs font-bold rounded ${selectedFee.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : selectedFee.status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                        {selectedFee.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                                    <p className="text-xs text-blue-500 dark:text-blue-400 font-medium uppercase tracking-wider mb-1">Balance Due</p>
                                    <p className="font-bold text-blue-900 dark:text-blue-200 text-xl">₹{((selectedFee.amount - selectedFee.discount) - parseFloat(selectedFee.total_paid || 0)).toFixed(2)}</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateFee} className="mb-8 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Modify Base Settings</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Base Amount (₹)</label>
                                        <input type="number" step="0.01" name="amount" required defaultValue={selectedFee.amount} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Discount override (₹)</label>
                                        <input type="number" step="0.01" name="discount" required defaultValue={selectedFee.discount} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition-colors" />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button type="submit" className="px-4 py-2.5 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition-colors flex items-center">
                                        <Edit className="w-4 h-4 mr-2" /> Save Settings
                                    </button>
                                </div>
                            </form>

                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Payment History Archive</h3>
                            {paymentHistory.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">No payments have been recorded for this fee block yet.</div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                            <th className="p-3 rounded-tl-lg font-medium">Transaction Date</th>
                                            <th className="p-3 font-medium">Payment Mode</th>
                                            <th className="p-3 text-right rounded-tr-lg font-medium">Amount Received</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paymentHistory.map(ph => (
                                            <tr key={ph.id}>
                                                <td className="p-3 text-slate-800">
                                                    {editingPaymentId === ph.id ? (
                                                        <input type="datetime-local" value={editPaymentForm.date || ''} onChange={e => setEditPaymentForm({ ...editPaymentForm, date: e.target.value })} className="border rounded px-2 py-1 text-xs w-full" />
                                                    ) : new Date(ph.date).toLocaleString()}
                                                </td>
                                                <td className="p-3 text-slate-600">
                                                    {editingPaymentId === ph.id ? (
                                                        <select value={editPaymentForm.payment_mode || ''} onChange={e => setEditPaymentForm({ ...editPaymentForm, payment_mode: e.target.value })} className="border rounded px-2 py-1 text-xs w-full">
                                                            <option value="CASH">Cash</option>
                                                            <option value="UPI">UPI</option>
                                                            <option value="BANK_TRANSFER">Bank Transfer</option>
                                                        </select>
                                                    ) : <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold">{ph.payment_mode}</span>}
                                                </td>
                                                <td className="p-3 text-right font-bold text-emerald-600">
                                                    {editingPaymentId === ph.id ? (
                                                        <div className="flex gap-2 justify-end items-center">
                                                            <input type="number" step="0.01" value={editPaymentForm.amount_paid || ''} onChange={e => setEditPaymentForm({ ...editPaymentForm, amount_paid: e.target.value })} className="border rounded px-2 py-1 text-xs w-24 text-right" />
                                                            <button onClick={() => handleUpdatePaymentSubmit(ph.id)} className="px-2 py-1 bg-blue-600 text-white rounded flex items-center gap-1 hover:bg-blue-700 text-xs font-semibold" title="Save changes">
                                                                <Save className="w-3 h-3" /> Save
                                                            </button>
                                                            <button onClick={() => setEditingPaymentId(null)} className="px-2 py-1 bg-slate-200 text-slate-700 rounded flex items-center gap-1 hover:bg-slate-300 text-xs font-semibold" title="Cancel edit">
                                                                <X className="w-3 h-3" /> Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-end gap-2 items-center">
                                                            ₹{parseFloat(ph.amount_paid).toFixed(2)}
                                                            <button onClick={() => {
                                                                setEditingPaymentId(ph.id);
                                                                setEditPaymentForm({ amount_paid: ph.amount_paid, payment_mode: ph.payment_mode, date: new Date(ph.date).toISOString().slice(0, 16) });
                                                            }} className="p-1 text-slate-400 hover:text-blue-600 ml-2" title="Edit Payment">
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleDeletePayment(ph.id)} className="p-1 text-slate-400 hover:text-red-500" title="Delete Payment">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isAdvancePaymentModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10">
                            <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-400">Advance/Custom Payment</h2>
                            <button onClick={() => setIsAdvancePaymentModalOpen(false)} className="text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleAdvancePayment} className="p-6">
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Student</label>
                                    <select name="student_id" required className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200">
                                        <option value="">-- select a student --</option>
                                        {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_code})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (₹)</label>
                                    <input type="number" step="0.01" name="amount_paid" required className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 font-bold text-lg text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
                                    <select name="payment_mode" className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200">
                                        <option value="CASH">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors text-lg flex justify-center items-center">
                                <IndianRupee className="w-5 h-5 mr-1" /> Record Advanced Payment
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {receiptData && (
                <ReceiptModal paymentData={receiptData} onClose={() => setReceiptData(null)} />
            )}
        </div>
    );
};

export default FeeManagement;
