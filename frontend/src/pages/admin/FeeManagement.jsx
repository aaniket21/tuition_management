import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { CreditCard, Plus, IndianRupee, Banknote, Printer, Search, TrendingUp, AlertCircle, User, Edit, X, Download, FileSpreadsheet, FileText } from 'lucide-react';
import ReceiptModal from '../../components/admin/ReceiptModal';
import * as XLSX from 'xlsx';

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
    const [loading, setLoading] = useState(false);

    // Modal states
    const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
    const [isEditStructureModalOpen, setIsEditStructureModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [receiptData, setReceiptData] = useState(null);
    const [selectedFee, setSelectedFee] = useState(null);
    const [selectedStructure, setSelectedStructure] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [structRes, feeRes, classRes, repRes] = await Promise.all([
                api.get('/admin/fees/structures'),
                api.get('/admin/fees/students'),
                api.get('/admin/classes'),
                api.get('/admin/fees/reports')
            ]);
            setStructures(structRes.data);
            setStudentFees(feeRes.data);
            setClasses(classRes.data);
            setReports(repRes.data);
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
            await api.post('/admin/fees/collect', {
                student_fee_id: selectedFee.id,
                amount_paid,
                payment_mode
            });
            alert('Payment recorded successfully!');
            setIsPaymentModalOpen(false);
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

    const handleUpdateFee = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            await api.put(`/admin/fees/students/${selectedFee.id}`, {
                amount: formData.get('amount'),
                discount: formData.get('discount')
            });
            alert('Fee profile updated successfully!');
            setIsEditModalOpen(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating fee');
        }
    };

    // Derived Data
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

    const handleExportCSV = () => {
        const data = getReportExportData();
        if (data.length === 0) return alert('No data to export.');
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj => Object.values(obj).map(val => `"${val}"`).join(','));
        const csvContent = [headers, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Fee_Report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Fee Processing</h1>
                    <p className="text-slate-500 mt-1">Manage structures, collect payments, and track receivables</p>
                </div>
                <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* TAB CONTENT: Collection Point */}
            {activeTab === 'collection' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <h2 className="text-lg font-semibold text-slate-800">Student Fee Profiles</h2>
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Search student..." className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                                    <th className="p-4 font-medium">Student Info</th>
                                    <th className="p-4 font-medium">Class / Month</th>
                                    <th className="p-4 font-medium">Total Bill</th>
                                    <th className="p-4 font-medium">Paid</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentFees.map(fee => (
                                    <tr key={fee.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-800">{fee.first_name} {fee.last_name}</div>
                                            <div className="text-xs text-slate-500">{fee.student_code}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-medium">{fee.class_name}</div>
                                            <div className="text-xs text-slate-500">{fee.month}</div>
                                        </td>
                                        <td className="p-4 text-sm font-semibold">₹{(fee.amount - fee.discount).toFixed(2)}</td>
                                        <td className="p-4 text-sm text-emerald-600 font-medium">₹{parseFloat(fee.total_paid).toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${fee.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                                fee.status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {fee.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleViewProfile(fee)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded transition-colors" title="View Profile">
                                                    <User className="w-4 h-4" />
                                                </button>
                                                {fee.status !== 'PAID' && (
                                                    <button onClick={() => { setSelectedFee(fee); setIsEditModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-amber-600 bg-slate-100 hover:bg-amber-50 rounded transition-colors" title="Edit Profile">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {fee.status !== 'PAID' && (
                                                    <button onClick={() => { setSelectedFee(fee); setIsPaymentModalOpen(true); }} className="px-3 py-1.5 bg-blue-600 text-white rounded font-medium text-xs hover:bg-blue-700 transition-colors flex items-center shadow-sm">
                                                        <Banknote className="w-3 h-3 mr-1" /> Collect
                                                    </button>
                                                )}
                                                <button onClick={() => setReceiptData(fee)} className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded transition-colors" title="Print latest statement">
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {studentFees.length === 0 && (
                                    <tr><td colSpan="6" className="p-8 text-center text-slate-500 font-medium">No fee profiles generated yet.</td></tr>
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
                <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
                    <div className="p-6 border-b border-red-100 bg-red-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-red-900 flex items-center">
                                <AlertCircle className="w-5 h-5 mr-2 text-red-500" /> Action Required: Overdue Accounts
                            </h2>
                            <p className="text-red-700 text-sm mt-1">Students listed here have unpaid balances.</p>
                        </div>
                        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
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
                        <h2 className="text-xl font-bold text-slate-800">Financial Overview</h2>
                        <div className="flex gap-2">
                            <button onClick={handleExportCSV} className="flex items-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm">
                                <FileText className="w-4 h-4 mr-2 text-slate-500" /> Export CSV
                            </button>
                            <button onClick={handleExportExcel} className="flex items-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm">
                                <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" /> Export Excel
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
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-blue-50">
                            <h2 className="text-xl font-bold text-blue-900">Collect Payment</h2>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-blue-400 hover:text-blue-600">×</button>
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

            {isEditModalOpen && selectedFee && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800">Edit Fee Profile</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleUpdateFee} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Base Amount (₹)</label>
                                <input type="number" step="0.01" name="amount" required defaultValue={selectedFee.amount} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Discount override (₹)</label>
                                <input type="number" step="0.01" name="discount" required defaultValue={selectedFee.discount} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                            </div>
                            <button type="submit" className="w-full py-2.5 font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-sm transition-colors">
                                Save Changes
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
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Student</p>
                                    <p className="font-bold text-slate-800">{selectedFee.first_name} {selectedFee.last_name}</p>
                                    <p className="text-sm text-slate-500 mt-1">{selectedFee.student_code}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Fee Plan</p>
                                    <p className="font-bold text-slate-800">{selectedFee.class_name}</p>
                                    <p className="text-sm text-slate-500 mt-1">{selectedFee.month}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Ledger Status</p>
                                    <span className={`inline-flex px-2 py-1 text-xs font-bold rounded ${selectedFee.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : selectedFee.status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                        {selectedFee.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <p className="text-xs text-blue-500 font-medium uppercase tracking-wider mb-1">Balance Due</p>
                                    <p className="font-bold text-blue-900 text-xl">₹{((selectedFee.amount - selectedFee.discount) - parseFloat(selectedFee.total_paid || 0)).toFixed(2)}</p>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Payment History Archive</h3>
                            {paymentHistory.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-slate-100">No payments have been recorded for this fee block yet.</div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-500">
                                            <th className="p-3 rounded-tl-lg font-medium">Transaction Date</th>
                                            <th className="p-3 font-medium">Payment Mode</th>
                                            <th className="p-3 text-right rounded-tr-lg font-medium">Amount Received</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paymentHistory.map(ph => (
                                            <tr key={ph.id}>
                                                <td className="p-3 text-slate-800">{new Date(ph.date).toLocaleString()}</td>
                                                <td className="p-3 text-slate-600"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold">{ph.payment_mode}</span></td>
                                                <td className="p-3 text-right font-bold text-emerald-600">₹{parseFloat(ph.amount_paid).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
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
