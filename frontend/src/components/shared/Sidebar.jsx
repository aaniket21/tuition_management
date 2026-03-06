import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Users, BookOpen, Calendar, DollarSign, Bell } from 'lucide-react';

const Sidebar = () => {
    const { user } = useAuth();
    const location = useLocation();

    let links = [];

    if (user?.role === 'ADMIN') {
        links = [
            { name: 'Dashboard', path: '/admin', icon: Home },
            { name: 'Students', path: '/admin/students', icon: Users },
            { name: 'Classes', path: '/admin/classes', icon: BookOpen },
            { name: 'Attendance', path: '/admin/attendance', icon: Calendar },
            { name: 'Fees', path: '/admin/fees', icon: DollarSign },
            { name: 'Notices', path: '/admin/notices', icon: Bell },
        ];
    } else if (user?.role === 'STUDENT') {
        links = [
            { name: 'Dashboard', path: '/student', icon: Home },
            { name: 'Timetable', path: '/student/timetable', icon: Calendar },
            { name: 'Attendance', path: '/student/attendance', icon: BookOpen },
            { name: 'Fees', path: '/student/fees', icon: DollarSign },
            { name: 'Notices', path: '/student/notices', icon: Bell },
        ];
    } else if (user?.role === 'PARENT') {
        links = [
            { name: 'Dashboard', path: '/parent', icon: Home },
            { name: 'Child Attendance', path: '/parent/attendance', icon: Calendar },
            { name: 'Child Fees', path: '/parent/fees', icon: DollarSign },
            { name: 'Notices', path: '/parent/notices', icon: Bell },
        ];
    }

    return (
        <aside className="w-64 bg-white border-r min-h-screen flex flex-col hidden md:flex">
            <div className="h-16 flex items-center justify-center border-b px-4">
                <span className="text-xl font-bold text-blue-600 truncate">Tuition Manager</span>
            </div>
            <nav className="flex-1 py-4 animate-in fade-in slide-in-from-left-4 duration-500">
                <ul className="space-y-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path || (link.path !== '/admin' && link.path !== '/student' && link.path !== '/parent' && location.pathname.startsWith(link.path));
                        return (
                            <li key={link.path}>
                                <Link
                                    to={link.path}
                                    className={`flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 ${isActive ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`}
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
