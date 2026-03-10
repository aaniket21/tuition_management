import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';

const PublicLayout = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    return (
        <div className="min-h-screen flex flex-col font-sans bg-white dark:bg-slate-900 selection:bg-blue-100 dark:selection:bg-blue-900/50 selection:text-blue-900 dark:selection:text-blue-100 transition-colors duration-200">
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between px-4 sm:px-8 py-3 sticky top-0 z-50 transition-colors duration-200">
                <Link to="/" className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    Tuition Center
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex gap-8 items-center">
                    <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Home</Link>
                    <Link to="/about" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">About</Link>
                    <Link to="/courses" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Courses</Link>
                    <Link to="/contact" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Contact</Link>
                    <ThemeToggle />
                    <Link to="/login" className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 dark:hover:shadow-blue-900/50 font-medium transition-all hover:-translate-y-0.5">
                        Log In
                    </Link>
                </nav>

                {/* Mobile Menu Toggle button */}
                <div className="md:hidden flex items-center gap-4">
                    <ThemeToggle />
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </header>

            {/* Mobile Nav Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed top-[60px] left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-lg z-40 p-4 animate-in slide-in-from-top-2">
                    <nav className="flex flex-col gap-4">
                        <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg font-medium">Home</Link>
                        <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg font-medium">About</Link>
                        <Link to="/courses" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg font-medium">Courses</Link>
                        <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg font-medium">Contact</Link>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center px-5 py-3 bg-blue-600 text-white rounded-lg font-medium mt-2">
                                Log In
                            </Link>
                        </div>
                    </nav>
                </div>
            )}
            <main className="flex-1 bg-gray-50 dark:bg-slate-900 flex flex-col relative w-full transition-colors duration-200">
                {children}
            </main>
            <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-12 text-center md:text-left border-t border-slate-800 dark:border-slate-800/50 transition-colors duration-200">
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div className="flex flex-col items-center md:items-start">
                        <h3 className="text-white font-bold text-lg mb-4">Tuition Center</h3>
                        <p className="text-sm leading-relaxed max-w-sm">Providing quality education and fostering excellence in students across all disciplines.</p>
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                        <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm text-center md:text-left">
                            <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
                            <li><Link to="/courses" className="hover:text-white transition">Our Courses</Link></li>
                            <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
                        </ul>
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                        <h3 className="text-white font-bold text-lg mb-4">Contact</h3>
                        <p className="text-sm mb-2 text-center md:text-left">123 Education Lane, Cityville</p>
                        <p className="text-sm mb-2 text-center md:text-left">contact@tuitioncenter.com</p>
                        <p className="text-sm text-center md:text-left">+1 (555) 123-4567</p>
                    </div>
                </div>
                <div className="border-t border-slate-800 pt-8 text-sm">
                    <p>&copy; {new Date().getFullYear()} Tuition Center Management System. Phase 1 Release.</p>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
