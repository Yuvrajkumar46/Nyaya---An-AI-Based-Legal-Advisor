import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

const ADMIN_LINKS = [
    { icon: '🏠', label: 'Dashboard', path: '/admin/dashboard' },
    { icon: '👨‍⚖️', label: 'Manage Advocates', path: '/admin/advocates' },
    { icon: '👥', label: 'Users', path: '/admin/users' },
    { icon: '📞', label: 'Call Logs', path: '/admin/calls' },

];

export default function AdminSidebar({ isOpen, onClose }) {
    const { logoutAdmin } = useAdminAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutAdmin();
        navigate('/admin/login', { replace: true });
    };

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header" style={{ borderBottomColor: 'rgba(0, 212, 255, 0.2)' }}>
                    <div className="sidebar-brand text-cyan">
                        <span className="sidebar-brand-icon" style={{ background: 'var(--bg-input)' }}>🛡️</span>
                        <span>Nyaya Admin</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {ADMIN_LINKS.map(link => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={() => window.innerWidth <= 768 && onClose()}
                        >
                            <span className="sidebar-link-icon">{link.icon}</span>
                            <span className="sidebar-link-label">{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="sidebar-logout" onClick={handleLogout}>
                        <span className="sidebar-link-icon">🚪</span>
                        <span className="sidebar-link-label">Admin Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
