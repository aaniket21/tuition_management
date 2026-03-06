import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Users, BookOpen, DollarSign, Activity } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalClasses: 0,
        attendancePresentRate: 0,
        revenueCollected: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // In a real scenario, this would be a single comprehensive dashboard endpoint
                // For now, doing multiple parallel calls based on the APIs built
                const [students, classes, attnReport, feesReport] = await Promise.all([
                    api.get('/admin/students'),
                    api.get('/admin/classes'),
                    api.get('/admin/reports/attendance'),
                    api.get('/admin/reports/fees')
                ]);

                let totalAttn = 0;
                let totalPresent = 0;
                attnReport.data.forEach(r => {
                    totalAttn += parseInt(r.total_records) || 0;
                    totalPresent += parseInt(r.present_count) || 0;
                });

                setStats({
                    totalStudents: students.data.length,
                    totalClasses: classes.data.length,
                    attendancePresentRate: totalAttn > 0 ? ((totalPresent / totalAttn) * 100).toFixed(1) : 0,
                    revenueCollected: feesReport.data.total_collected || 0
                });
            } catch (err) {
                console.error('Error fetching dashboard stats', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Students"
                    value={stats.totalStudents}
                    icon={Users}
                    color="text-blue-600"
                    bg="bg-blue-100"
                />
                <StatCard
                    title="Active Classes"
                    value={stats.totalClasses}
                    icon={BookOpen}
                    color="text-emerald-600"
                    bg="bg-emerald-100"
                />
                <StatCard
                    title="Attendance Rate"
                    value={`${stats.attendancePresentRate}%`}
                    icon={Activity}
                    color="text-purple-600"
                    bg="bg-purple-100"
                />
                <StatCard
                    title="Fees Collected"
                    value={`$${stats.revenueCollected}`}
                    icon={DollarSign}
                    color="text-amber-600"
                    bg="bg-amber-100"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Placeholder for future charts */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-96 flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Enrollment Trends</h2>
                    <div className="flex-1 flex items-center justify-center bg-slate-50 border border-dashed border-slate-300 rounded-lg text-slate-400">
                        Chart visualization will render here
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-96 flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h2>
                    <div className="flex-1 flex items-center justify-center bg-slate-50 border border-dashed border-slate-300 rounded-lg text-slate-400">
                        Activity feed will render here
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md cursor-default">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${bg} ${color}`}>
            <Icon className="w-7 h-7" />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
    </div>
);

export default AdminDashboard;
