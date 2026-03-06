import Sidebar from '../shared/Sidebar';
import Header from '../shared/Header';

const MainLayout = ({ children }) => {
    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
