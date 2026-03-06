import { useState } from 'react';
import Sidebar from '../shared/Sidebar';
import Header from '../shared/Header';

const MainLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden transition-colors duration-200">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full relative">
                <Header setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 lg:p-6 transition-colors duration-200 w-full">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
