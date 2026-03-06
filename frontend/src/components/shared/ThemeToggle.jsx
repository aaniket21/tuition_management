import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-blue-50 text-slate-700 hover:bg-blue-100'}`}
            title="Toggle theme"
            aria-label="Toggle theme"
        >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
    );
};

export default ThemeToggle;
