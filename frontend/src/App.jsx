import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import MainLayout from './components/layouts/MainLayout';
import PublicLayout from './components/layouts/PublicLayout';

import Home from './pages/public/Home';
import Login from './pages/public/Login';
import About from './pages/public/About';
import Courses from './pages/public/Courses';
import Contact from './pages/public/Contact';

import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import ClassManagement from './pages/admin/ClassManagement';
import ClassDetails from './pages/admin/ClassDetails';
import FeeManagement from './pages/admin/FeeManagement';

// Moduler Placeholders
const GenericPlaceholder = ({ title }) => (
    <div className="p-8 text-xl bg-white rounded-2xl shadow-sm border border-slate-100 h-[calc(100vh-8rem)] flex items-center justify-center flex-col animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
        <p className="text-slate-500">This module form view is under construction for Phase 1.1</p>
    </div>
);

const StudentDashboard = () => <div className="p-8"><GenericPlaceholder title="Student Primary View" /></div>;
const ParentDashboard = () => <div className="p-8"><GenericPlaceholder title="Parent Supervision View" /></div>;
const Unauthorized = () => <div className="p-8 text-red-500 font-bold bg-white h-screen flex items-center justify-center text-3xl">403 | Unauthorized Access</div>;

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="h-screen w-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }
    return children;
};

// Public Route (redirects if already logged in)
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="h-screen w-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (user) {
        if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
        if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
        if (user.role === 'PARENT') return <Navigate to="/parent" replace />;
    }
    return children;
};

function App() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
            <Route path="/courses" element={<PublicLayout><Courses /></PublicLayout>} />
            <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
            <Route path="/login" element={<PublicRoute><PublicLayout><Login /></PublicLayout></PublicRoute>} />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><MainLayout><AdminDashboard /></MainLayout></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['ADMIN']}><MainLayout><StudentManagement /></MainLayout></ProtectedRoute>} />
            <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['ADMIN']}><MainLayout><ClassManagement /></MainLayout></ProtectedRoute>} />
            <Route path="/admin/classes/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><MainLayout><ClassDetails /></MainLayout></ProtectedRoute>} />
            <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={['ADMIN']}><MainLayout><FeeManagement /></MainLayout></ProtectedRoute>} />
            <Route path="/admin/notices" element={<ProtectedRoute allowedRoles={['ADMIN']}><MainLayout><GenericPlaceholder title="Notice Dispatch" /></MainLayout></ProtectedRoute>} />

            {/* Protected Student Routes */}
            <Route path="/student" element={<ProtectedRoute allowedRoles={['STUDENT']}><MainLayout><StudentDashboard /></MainLayout></ProtectedRoute>} />
            <Route path="/student/timetable" element={<ProtectedRoute allowedRoles={['STUDENT']}><MainLayout><GenericPlaceholder title="My Timetable" /></MainLayout></ProtectedRoute>} />
            <Route path="/student/fees" element={<ProtectedRoute allowedRoles={['STUDENT']}><MainLayout><GenericPlaceholder title="Fee Status" /></MainLayout></ProtectedRoute>} />
            <Route path="/student/notices" element={<ProtectedRoute allowedRoles={['STUDENT']}><MainLayout><GenericPlaceholder title="Notices" /></MainLayout></ProtectedRoute>} />

            {/* Protected Parent Routes */}
            <Route path="/parent" element={<ProtectedRoute allowedRoles={['PARENT']}><MainLayout><ParentDashboard /></MainLayout></ProtectedRoute>} />
            <Route path="/parent/fees" element={<ProtectedRoute allowedRoles={['PARENT']}><MainLayout><GenericPlaceholder title="Child Fee Status" /></MainLayout></ProtectedRoute>} />
            <Route path="/parent/notices" element={<ProtectedRoute allowedRoles={['PARENT']}><MainLayout><GenericPlaceholder title="Important Notices" /></MainLayout></ProtectedRoute>} />

            {/* Other */}
            <Route path="/unauthorized" element={<PublicLayout><Unauthorized /></PublicLayout>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
