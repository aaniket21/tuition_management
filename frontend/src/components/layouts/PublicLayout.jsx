import { Link } from 'react-router-dom';
import ThemeToggle from '../shared/ThemeToggle';

const PublicLayout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col font-sans bg-white dark:bg-slate-900 selection:bg-blue-100 dark:selection:bg-blue-900/50 selection:text-blue-900 dark:selection:text-blue-100 transition-colors duration-200">
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 shadow-sm h-16 flex items-center justify-between px-8 sticky top-0 z-50 transition-colors duration-200">
                <Link to="/" className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    Tuition Center
                </Link>
                <nav className="flex gap-8 items-center">
                    <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Home</Link>
                    <Link to="/about" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">About</Link>
                    <Link to="/courses" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Courses</Link>
                    <Link to="/contact" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Contact</Link>
                    <ThemeToggle />
                    <Link to="/login" className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 dark:hover:shadow-blue-900/50 font-medium transition-all hover:-translate-y-0.5">
                        Log In
                    </Link>
                </nav>
            </header>
            <main className="flex-1 bg-gray-50 dark:bg-slate-900 flex flex-col relative w-full transition-colors duration-200">
                {children}
            </main>
            <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-12 text-center border-t border-slate-800 dark:border-slate-800/50 transition-colors duration-200">
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-left mb-8">
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Tuition Center</h3>
                        <p className="text-sm leading-relaxed">Providing quality education and fostering excellence in students across all disciplines.</p>
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
                            <li><Link to="/courses" className="hover:text-white transition">Our Courses</Link></li>
                            <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Contact</h3>
                        <p className="text-sm mb-2">123 Education Lane, Cityville</p>
                        <p className="text-sm mb-2">contact@tuitioncenter.com</p>
                        <p className="text-sm">+1 (555) 123-4567</p>
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
