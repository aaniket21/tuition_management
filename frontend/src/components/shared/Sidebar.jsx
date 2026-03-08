import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Users, BookOpen, Calendar, DollarSign, Bell, X, LayoutDashboard, UserCircle } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user } = useAuth();
    const location = useLocation();

    let links = [];

    if (user?.role === 'ADMIN') {
        links = [
            { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
            { name: 'Student Management', path: '/admin/students', icon: UserCircle },
            { name: 'Classes & Batches', path: '/admin/classes', icon: BookOpen },
            { name: 'Fees', path: '/admin/fees', icon: DollarSign },
            { name: 'Notices', path: '/admin/notices', icon: Bell },
        ];
    } else if (user?.role === 'STUDENT') {
        links = [
            { name: 'Dashboard', path: '/student', icon: Home },
            { name: 'Timetable', path: '/student/timetable', icon: Calendar },
            { name: 'Fees', path: '/student/fees', icon: DollarSign },
            { name: 'Notices', path: '/student/notices', icon: Bell },
        ];
    } else if (user?.role === 'PARENT') {
        links = [
            { name: 'Dashboard', path: '/parent', icon: Home },
            { name: 'Child Fees', path: '/parent/fees', icon: DollarSign },
            { name: 'Notices', path: '/parent/notices', icon: Bell }
        ];
    }

    return (
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="h-16 flex items-center justify-between lg:justify-center border-b dark:border-slate-800 px-4 transition-colors duration-200 shrink-0">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400 truncate">Tuition Manager</span>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 animate-in fade-in slide-in-from-left-4 duration-500">
                <ul className="space-y-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path || (link.path !== '/admin' && link.path !== '/student' && link.path !== '/parent' && location.pathname.startsWith(link.path));
                        return (
                            <li key={link.path}>
                                <Link
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 ${isActive ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-600 dark:border-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
                                >
                                    <Icon className={`w-5 h-5 mr-3 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                                    {link.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
