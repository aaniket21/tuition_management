import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const Header = ({ setSidebarOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 shadow-sm z-10 sticky top-0 transition-colors duration-200 shrink-0 w-full">
            <div className="flex items-center lg:hidden gap-3">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
                    aria-label="Open menu"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400 truncate">Tuition Manager</span>
            </div>
            <div className="hidden lg:flex flex-1">
                {/* Search or breadcrumbs can go here */}
            </div>
            <div className="flex items-center gap-2 lg:gap-4 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-800 px-2 lg:px-3 py-1.5 rounded-full border dark:border-slate-700 transition-colors">
                    <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 transition-colors shrink-0">
                        <User className="w-4 h-4" />
                    </div>
                    <span className="hidden sm:inline-flex items-center pr-1 truncate max-w-[120px] lg:max-w-none">
                        <span className="truncate">{user?.username}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase ml-1.5 bg-gray-200/50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded shrink-0">{user?.role}</span>
                    </span>
                </div>
                <ThemeToggle />
                <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-all duration-200"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};

export default Header;
