import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // Check local storage or system preference on initial load
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode !== null) {
            return JSON.parse(savedMode);
        }
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        // Apply the class to the html element
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        // Save user preference
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
