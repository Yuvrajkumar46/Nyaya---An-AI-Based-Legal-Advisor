import { Navigate, useLocation } from 'react-router-dom';

export default function AdminRoute({ children }) {
    const location = useLocation();

    // Directly check localStorage — no context dependency
    const adminToken = localStorage.getItem('adminToken')
        || localStorage.getItem('admin_token')
        || localStorage.getItem('nyaya_admin_token');

    console.log('AdminRoute direct check — token:', adminToken ? 'FOUND' : 'NOT FOUND');

    if (!adminToken) {
        console.log('No admin token — redirecting to admin login');
        return <Navigate to="/admin/login" replace />;
    }

    return children;
}
