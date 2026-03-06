import { useState, useEffect } from 'react';
import {
    Users, BookOpen, Activity, DollarSign, UserPlus, FileWarning,
    CalendarCheck, UserX, Clock, Bell, User, Layout, ArrowUpRight
} from 'lucide-react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import EventModal from './EventModal';

const AdminDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notices, setNotices] = useState([]);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [currentEvent, setCurrentEvent] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch metrics, events, and notices concurrently
                const [metricsRes, eventsRes, noticesRes] = await Promise.all([
                    api.get('/admin/dashboard/metrics'),
                    api.get('/admin/events'),
                    api.get('/admin/notices')
                ]);
                setDashboardData(metricsRes.data);
                setEvents(eventsRes.data);
                setNotices(noticesRes.data);
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
                setError('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return (
        <div className="flex h-full items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
                <p className="text-slate-500 font-medium">Aggregating system data...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex h-full items-center justify-center min-h-[60vh]">
            <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl border border-red-100 flex items-center gap-3">
                <FileWarning className="w-6 h-6" />
                <span className="font-medium">{error}</span>
            </div>
        </div>
    );

    const { metrics, charts, sections } = dashboardData;
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    // Additional event handlers
    const handleAddEvent = () => {
        setCurrentEvent(null);
        setIsEventModalOpen(true);
    };

    const handleEditEvent = (event) => {
        setCurrentEvent(event);
        setIsEventModalOpen(true);
    };

    const handleDeleteEvent = async (id) => {
        if (window.confirm('Are you sure you want to delete this event? The corresponding notice will also be removed.')) {
            try {
                await api.delete(`/admin/events/${id}`);
                fetchEventsAndNotices();
            } catch (err) {
                alert('Failed to delete event');
            }
        }
    };

    const fetchEventsAndNotices = async () => {
        try {
            const [eventsRes, noticesRes] = await Promise.all([
                api.get('/admin/events'),
                api.get('/admin/notices')
            ]);
            setEvents(eventsRes.data);
            setNotices(noticesRes.data);
        } catch (err) {
            console.error('Error fetching updates:', err);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header / Alerts Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">Admin Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium transition-colors">System Overview & Analytics</p>
                </div>
                {/* Alerts Widget */}
                <div className="flex gap-3 mt-2 md:mt-0 overflow-x-auto pb-2 w-full md:w-auto max-w-full">
                    {metrics.pendingFees > 0 && (
                        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-sm transition-colors">
                            <DollarSign className="w-4 h-4" /> Pending Fees: ${metrics.pendingFees}
                        </div>
                    )}
                    {metrics.inactiveStudents >= 3 && (
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-sm transition-colors">
                            <UserX className="w-4 h-4" /> {metrics.inactiveStudents} Inactive Students
                        </div>
                    )}
                </div>
            </div>

            {/* Top Section: Key Metrics Grid (8 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Total Students" value={metrics.totalStudents} icon={Users} color="text-blue-600 dark:text-blue-400" bg="bg-blue-100 dark:bg-blue-900/30" />
                <StatCard title="Active Classes" value={metrics.totalClasses} icon={BookOpen} color="text-indigo-600 dark:text-indigo-400" bg="bg-indigo-100 dark:bg-indigo-900/30" />
                <StatCard title="Attendance Rate" value={`${metrics.attendanceRate}%`} icon={Activity} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-100 dark:bg-emerald-900/30" />
                <StatCard title="Fees Collected" value={`$${metrics.feesCollected}`} icon={DollarSign} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-100 dark:bg-emerald-900/30" />

                <StatCard title="New Students (Month)" value={metrics.newStudents} icon={UserPlus} color="text-purple-600 dark:text-purple-400" bg="bg-purple-100 dark:bg-purple-900/30" />
                <StatCard title="Pending Fees" value={`$${metrics.pendingFees}`} icon={Clock} color="text-amber-600 dark:text-amber-400" bg="bg-amber-100 dark:bg-amber-900/30" />
                <StatCard title="Today's Attendance" value={`${metrics.todayAttendance.present}/${metrics.todayAttendance.total}`} icon={CalendarCheck} color="text-sky-600 dark:text-sky-400" bg="bg-sky-100 dark:bg-sky-900/30" />
                <StatCard title="Inactive Students" value={metrics.inactiveStudents} icon={UserX} color="text-red-500 dark:text-red-400" bg="bg-red-100 dark:bg-red-900/30" />
            </div>

            {/* Middle Section: Big Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Enrollment Trends Area Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col transition-colors duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Enrollment Trends</h2>
                        <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded transition-colors duration-200">Last 6 Months</span>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={charts.enrollmentTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" activeDot={{ r: 6 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Fees Collection Bar Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col transition-colors duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Fees Collection</h2>
                        <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded transition-colors duration-200">Last 6 Months</span>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.monthlyFeesCollection} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
                                <Tooltip
                                    formatter={(value) => [`$${value}`, 'Collected']}
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="collection" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Lower Section: Secondary Charts & Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Weekly Attendance Trend */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col transition-colors duration-200">
                    <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Weekly Attendance</h2>
                    <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={charts.weeklyAttendanceTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={5} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                                <Tooltip formatter={(value) => [`${value}%`, 'Attendance Rate']} contentStyle={{ fontSize: '12px', borderRadius: '6px' }} />
                                <Line type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Class Wise Distribution Pie Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col transition-colors duration-200">
                    <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><Layout className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Class Distribution</h2>
                    <div className="flex-1 min-h-[200px] flex items-center justify-center">
                        {charts.classDistribution && charts.classDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={charts.classDistribution}
                                        cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {charts.classDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-slate-400 text-sm italic">No data available</p>
                        )}
                    </div>
                </div>

                {/* Quick Actions Panel */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-xl shadow-sm p-6 text-white flex flex-col transition-colors duration-200">
                    <h2 className="text-md font-bold mb-5 flex items-center gap-2 text-slate-100 dark:text-slate-300 border-b border-slate-700 dark:border-slate-800 pb-3 transition-colors duration-200">
                        <ArrowUpRight className="w-5 h-5 text-blue-400 dark:text-blue-500" /> Quick Actions
                    </h2>
                    <div className="flex flex-col gap-3 flex-1 justify-center">
                        <Link to="/admin/students" className="bg-white/10 hover:bg-white/20 border border-white/5 transition-colors w-full py-2.5 px-4 rounded-lg flex items-center text-sm font-medium">
                            <UserPlus className="w-4 h-4 mr-3 text-blue-400" /> Add New Student
                        </Link>
                        <Link to="/admin/classes" className="bg-white/10 hover:bg-white/20 border border-white/5 transition-colors w-full py-2.5 px-4 rounded-lg flex items-center text-sm font-medium">
                            <BookOpen className="w-4 h-4 mr-3 text-emerald-400" /> Create New Class
                        </Link>
                        <Link to="/admin/attendance" className="bg-white/10 hover:bg-white/20 border border-white/5 transition-colors w-full py-2.5 px-4 rounded-lg flex items-center text-sm font-medium">
                            <CalendarCheck className="w-4 h-4 mr-3 text-purple-400" /> Mark Attendance
                        </Link>
                        <Link to="/admin/fees" className="bg-white/10 hover:bg-white/20 border border-white/5 transition-colors w-full py-2.5 px-4 rounded-lg flex items-center text-sm font-medium">
                            <DollarSign className="w-4 h-4 mr-3 text-amber-400" /> Add Fee Payment
                        </Link>
                        <Link to="/admin/notices" className="bg-white/10 hover:bg-white/20 border border-white/5 transition-colors w-full py-2.5 px-4 rounded-lg flex items-center text-sm font-medium">
                            <Bell className="w-4 h-4 mr-3 text-sky-400" /> Publish Notice
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Feeds & Summaries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recent Activity Feed */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-200">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800 rounded-t-xl transition-colors duration-200">
                        <h2 className="text-md font-bold text-slate-800 dark:text-slate-100">Recent Activity</h2>
                    </div>
                    <div className="p-5">
                        <div className="space-y-6">
                            {sections.recentActivity.map((activity, index) => {
                                const IconComponent = activity.icon === 'UserPlus' ? UserPlus : activity.icon === 'DollarSign' ? DollarSign : activity.icon === 'Bell' ? Bell : Activity;
                                return (
                                    <div key={index} className="flex gap-4 relative">
                                        {/* Timeline line */}
                                        {index !== sections.recentActivity.length - 1 && (
                                            <div className="absolute left-[19px] top-10 bottom-[-24px] w-[2px] bg-slate-100" />
                                        )}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-600 bg-white dark:bg-slate-700 ${activity.color} transition-colors duration-200`}>
                                            <IconComponent className="w-4 h-4" />
                                        </div>
                                        <div className="pt-2">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{activity.message}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatTimeAgo(new Date(activity.timestamp))}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Class Overview Widget */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-200">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800 rounded-t-xl transition-colors duration-200">
                            <h2 className="text-md font-bold text-slate-800 dark:text-slate-100">Class Overview</h2>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 transition-colors duration-200">
                                        <th className="py-3 px-5 font-semibold">Class Name</th>
                                        <th className="py-3 px-5 font-semibold">Students</th>
                                        <th className="py-3 px-5 font-semibold text-right">Attendance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sections.classOverview.map((cls, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                                            <td className="py-3 px-5 font-medium text-slate-800 dark:text-slate-200">{cls.class_name}</td>
                                            <td className="py-3 px-5 text-slate-600 dark:text-slate-400">{cls.students}</td>
                                            <td className="py-3 px-5 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls.attendance >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    cls.attendance >= 80 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-red-50 text-red-700 border-red-100'
                                                    }`}>
                                                    {cls.attendance}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {sections.classOverview.length === 0 && (
                                        <tr><td colSpan="3" className="py-6 text-center text-slate-400 italic">No classes found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Upcoming Events Widget */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col w-full max-h-[400px] transition-colors duration-200">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 rounded-t-xl flex justify-between items-center shrink-0 transition-colors duration-200">
                            <h2 className="text-md font-bold text-slate-800 dark:text-slate-100">Upcoming Events</h2>
                            <button
                                onClick={handleAddEvent}
                                className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50 flex items-center justify-center w-6 h-6 rounded-full transition-colors"
                                title="Add Event"
                            >
                                +
                            </button>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto w-full">
                            {events.length > 0 ? (
                                <ul className="space-y-4 w-full">
                                    {events.map((evt) => {
                                        const dateObj = new Date(evt.event_date);
                                        const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
                                        const day = dateObj.getDate();
                                        // Pick a color theme depending on parity just for aesthetics
                                        const isEven = day % 2 === 0;
                                        const colors = isEven
                                            ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/50 text-rose-700 dark:text-rose-400'
                                            : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400';

                                        return (
                                            <li key={evt.id} className="flex items-start justify-between gap-3 group">
                                                <div className="flex items-start gap-3 flex-1 overflow-hidden">
                                                    <div className={`w-12 h-12 rounded border flex flex-col items-center justify-center shrink-0 transition-colors duration-200 ${colors}`}>
                                                        <span className="text-xs font-bold uppercase">{month}</span>
                                                        <span className="text-lg font-bold leading-none">{day}</span>
                                                    </div>
                                                    <div className="min-w-0 pr-2 pb-1 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                                                        <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate" title={evt.title}>{evt.title}</h4>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate" title={evt.description || 'Global Event'}>{evt.description || 'Global Event'}</p>
                                                    </div>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 pt-1">
                                                    <button onClick={() => handleEditEvent(evt)} className="text-slate-400 hover:text-blue-600 p-1" title="Edit Event">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                    <button onClick={() => handleDeleteEvent(evt.id)} className="text-slate-400 hover:text-red-600 p-1" title="Delete Event">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="text-center text-slate-400 py-6 text-sm italic">
                                    No upcoming events scheduled.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                {/* Notice Board Widget */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 col-span-1 lg:col-span-2 transition-colors duration-200">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800 rounded-t-xl transition-colors duration-200">
                        <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                            Notice Board
                        </h2>
                        <Link to="/admin/notices" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">View All</Link>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {notices.length > 0 ? (
                                notices.slice(0, 3).map((notice) => (
                                    <div key={notice.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-500 transition-colors bg-white dark:bg-slate-800 relative group overflow-hidden flex flex-col h-full">
                                        {/* Decorative top border */}
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-t-xl opacity-70 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex flex-wrap gap-2 justify-between items-start mb-3 pt-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${notice.audience === 'GLOBAL' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50'} border uppercase tracking-wider shrink-0`}>
                                                {notice.audience}
                                            </span>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1 shrink-0">
                                                <Clock className="w-3 h-3" />
                                                {formatTimeAgo(new Date(notice.created_at))}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-sm md:text-base line-clamp-2">{notice.title}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm line-clamp-3 leading-relaxed mt-auto">{notice.content}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-8 text-slate-400 italic text-sm border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                    No notices published yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                event={currentEvent}
                onSave={fetchEventsAndNotices}
            />
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition-all duration-200">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${bg} ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">{title}</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{value}</h3>
        </div>
    </div>
);

// Helper function to format time ago
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval >= 1) {
        const h = Math.floor(interval);
        return h === 1 ? "1 hour ago" : h + " hours ago";
    }
    interval = seconds / 60;
    if (interval >= 1) {
        const m = Math.floor(interval);
        return m === 1 ? "1 minute ago" : m + " minutes ago";
    }
    return "Just now";
}

export default AdminDashboard;
