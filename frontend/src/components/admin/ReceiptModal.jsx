import React from 'react';
import { Printer, X } from 'lucide-react';

const ReceiptModal = ({ paymentData, onClose }) => {
    if (!paymentData) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4 sm:p-6 overflow-y-auto print:bg-white print:p-0">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">

                {/* Header Actions (hidden when printing) */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center print:hidden bg-slate-50 shrink-0 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-slate-800">Print Receipt</h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                            <Printer className="w-4 h-4 mr-2" /> Print PDF
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Receipt Body */}
                <div className="p-6 sm:p-10 overflow-y-auto print:overflow-visible" id="printable-receipt">
                    <style type="text/css" media="print">
                        {`
                          @page { size: auto;  margin: 0mm; }
                          body * { visibility: hidden; }
                          #printable-receipt, #printable-receipt * { visibility: visible; }
                          #printable-receipt { position: absolute; left: 0; top: 0; width: 100%; height: 100%; padding: 40px; }
                        `}
                    </style>

                    <div className="text-center mb-8 border-b-2 border-slate-800 pb-6">
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">TUITION CENTER</h1>
                        <p className="text-slate-500 mt-1 uppercase tracking-widest text-sm">Official Fee Receipt</p>
                    </div>

                    <div className="flex justify-between mb-8 text-sm">
                        <div>
                            <p className="text-slate-500 mb-1">Receipt No:</p>
                            <p className="font-bold text-slate-800 text-lg">RCPT-{Math.floor(100000 + Math.random() * 900000)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-500 mb-1">Date:</p>
                            <p className="font-bold text-slate-800 text-lg">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-200">
                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                            <div>
                                <p className="text-slate-500">Student Name</p>
                                <p className="font-bold text-lg text-slate-800 uppercase">{paymentData.first_name} {paymentData.last_name}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Student ID</p>
                                <p className="font-bold text-lg text-slate-800">{paymentData.student_code}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Class / Batch</p>
                                <p className="font-bold text-lg text-slate-800">{paymentData.class_name}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Fee Month</p>
                                <p className="font-bold text-lg text-slate-800">{paymentData.month}</p>
                            </div>
                        </div>
                    </div>

                    <table className="w-full text-left mb-10 text-sm">
                        <thead>
                            <tr className="border-b-2 border-slate-200">
                                <th className="py-3 font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                                <th className="py-3 font-semibold text-slate-600 uppercase tracking-wider text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="py-4 font-medium text-slate-800">Total Program Fee</td>
                                <td className="py-4 font-medium text-slate-800 text-right">₹{parseFloat(paymentData.amount).toFixed(2)}</td>
                            </tr>
                            {parseFloat(paymentData.discount) > 0 && (
                                <tr>
                                    <td className="py-4 font-medium text-slate-800">Discount Applied</td>
                                    <td className="py-4 font-medium text-red-600 text-right">- ₹{parseFloat(paymentData.discount).toFixed(2)}</td>
                                </tr>
                            )}
                            <tr>
                                <td className="py-4 font-bold text-emerald-600 text-lg bg-emerald-50 rounded-lg px-2 mt-2 inline-block relative -left-2">
                                    Paid Previously
                                </td>
                                <td className="py-4 font-bold text-emerald-600 text-lg text-right">
                                    ₹{parseFloat(paymentData.total_paid || 0).toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-slate-800">
                                <td className="py-4 font-black text-slate-800 text-xl">Current Balance</td>
                                <td className="py-4 font-black text-slate-800 text-xl text-right">₹{((paymentData.amount - paymentData.discount) - parseFloat(paymentData.total_paid || 0)).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="flex justify-between items-end pt-12">
                        <div className="text-slate-500 text-xs italic w-64">
                            * This is a computer generated receipt and requires no physical signature.
                        </div>
                        <div className="text-center w-48">
                            <div className="border-b border-slate-400 mb-2 pb-8"></div>
                            <span className="text-sm font-semibold text-slate-600 uppercase">Authorized Signatory</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
