import { useAuth } from '../../context/AuthContext';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm z-10 sticky top-0">
            <div className="flex items-center md:hidden">
                <span className="text-xl font-bold text-blue-600 truncate">Tuition Manager</span>
            </div>
            <div className="hidden md:flex flex-1">
                {/* Search or breadcrumbs can go here */}
            </div>
            <div className="flex items-center gap-4 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <User className="w-4 h-4" />
                    </div>
                    <span className="hidden sm:inline-block pr-1">{user?.username} <span className="text-xs text-gray-500 uppercase ml-1">({user?.role})</span></span>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};

export default Header;
