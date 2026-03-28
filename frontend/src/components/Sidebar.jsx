import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { icon: '🤖', label: 'AI Guidance', path: '/ai-guidance' },
    { icon: '👨‍⚖️', label: 'Find Advocates', path: '/find-advocates' },
    { icon: '📅', label: 'Appointments', path: '/appointments' },
    { icon: '📞', label: 'Calls', path: '/calls' },
    { icon: '📁', label: 'Documents', path: '/documents' },
    { icon: '💳', label: 'Billing', path: '/billing' },
    { icon: '🔔', label: 'Notifications', path: '/notifications' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
];

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <>
            {/* Mobile overlay */}
            <div
                className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <span className="sidebar-brand-icon">⚖️</span>
                        <span>Nyaya</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {NAV_LINKS.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) => `sidebar-link ${isActive || (link.path === '/documents' && location.pathname.startsWith('/documents')) ? 'active' : ''}`}
                            onClick={() => {
                                // close sidebar on mobile after clicking
                                if (window.innerWidth <= 768) {
                                    onClose();
                                }
                            }}
                        >
                            <span className="sidebar-link-icon">{link.icon}</span>
                            <span className="sidebar-link-label">{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    {user ? (
                        <button className="sidebar-logout" onClick={handleLogout}>
                            <span className="sidebar-link-icon">🚪</span>
                            <span className="sidebar-link-label">Logout</span>
                        </button>
                    ) : (
                        <button className="sidebar-logout" onClick={() => navigate('/login')} style={{ color: 'var(--cyan-primary)' }}>
                            <span className="sidebar-link-icon">🔑</span>
                            <span className="sidebar-link-label">Login to Book</span>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}
