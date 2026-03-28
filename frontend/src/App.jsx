import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import BookAppointmentPage from './pages/BookAppointmentPage';

import JoinCallPage from './pages/calls/JoinCallPage';
import ActiveCallPage from './pages/calls/ActiveCallPage';
import CallSummaryPage from './pages/calls/CallSummaryPage';
import CallHistoryPage from './pages/calls/CallHistoryPage';

import AdvocateProfilePage from './pages/AdvocateProfilePage';
import FindAdvocatesPage from './pages/FindAdvocatesPage';

// Admin Context & Pages
import { AdminAuthProvider } from './context/AdminAuthContext';
import AdminRoute from './components/admin/AdminRoute';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ManageAdvocatesPage from './pages/admin/ManageAdvocatesPage';
import AddAdvocatePage from './pages/admin/AddAdvocatePage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCallLogsPage from './pages/admin/AdminCallLogsPage';
import Placeholder from './components/Placeholder';

// Phase 5: Documents Module
import DocumentsPage from './pages/documents/DocumentsPage';
import UploadDocumentPage from './pages/documents/UploadDocumentPage';
import DocumentDetailsPage from './pages/documents/DocumentDetailsPage';

import BillingPage from './pages/billing/BillingPage';
import AddMoneyPage from './pages/billing/AddMoneyPage';

import AIGuidancePage from './pages/AIGuidancePage';
import NotificationsPage from './pages/NotificationsPage';

import NotFoundPage from './pages/NotFoundPage';

import ProtectedRoute from './components/ProtectedRoute';

// Public only route (redirect if already logged in)
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    return !user ? children : <Navigate to="/dashboard" replace />;
};



function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AdminAuthProvider>
                    <Routes>
                        {/* Public Auth */}
                        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

                        {/* Public Feature Pages */}
                        <Route path="/find-advocates" element={<FindAdvocatesPage />} />
                        <Route path="/advocates/:advocate_id" element={<AdvocateProfilePage />} />
                        <Route path="/advocates/:id/book" element={<ProtectedRoute><BookAppointmentPage /></ProtectedRoute>} />

                        {/* Admin Routes */}
                        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
                        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
                        <Route path="/admin/advocates" element={<AdminRoute><ManageAdvocatesPage /></AdminRoute>} />
                        <Route path="/admin/advocates/add" element={<AdminRoute><AddAdvocatePage /></AdminRoute>} />
                        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
                        <Route path="/admin/calls" element={<AdminRoute><AdminCallLogsPage /></AdminRoute>} />
                        <Route path="/admin/billing" element={<AdminRoute><Placeholder title="Admin Billing" /></AdminRoute>} />

                        {/* Protected User Routes */}
                        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                        <Route path="/ai-guidance" element={<ProtectedRoute><AIGuidancePage /></ProtectedRoute>} />
                        <Route path="/upload" element={<Navigate to="/documents/upload" replace />} />
                        <Route path="/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />

                        {/* Phase 4: Paid Calls WebRTC endpoints */}
                        <Route path="/calls" element={<ProtectedRoute><CallHistoryPage /></ProtectedRoute>} />
                        <Route path="/calls/join/:appointment_id" element={<ProtectedRoute><JoinCallPage /></ProtectedRoute>} />
                        <Route path="/calls/active/:call_id" element={<ProtectedRoute><ActiveCallPage /></ProtectedRoute>} />
                        <Route path="/calls/summary/:call_id" element={<ProtectedRoute><CallSummaryPage /></ProtectedRoute>} />

                        {/* Phase 5: Documents Module endpoints */}
                        <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
                        <Route path="/documents/upload" element={<ProtectedRoute><UploadDocumentPage /></ProtectedRoute>} />
                        <Route path="/documents/:id" element={<ProtectedRoute><DocumentDetailsPage /></ProtectedRoute>} />

                        <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
                        <Route path="/billing/add-money" element={<ProtectedRoute><AddMoneyPage /></ProtectedRoute>} />

                        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                        <Route path="/forgot-password" element={<Placeholder title="Forgot Password" />} />

                        {/* Default redirect */}
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </AdminAuthProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
