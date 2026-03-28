import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminAuth } from '../../context/AdminAuthContext';
import api from '../../utils/api';

export default function AdminDashboardPage() {
    const { adminUser } = useAdminAuth();
    const [stats, setStats] = useState({
        total_users: 0,
        total_advocates: 0,
        verified_advocates: 0,
        pending_verification: 0,
        total_calls_this_month: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/v1/admin/stats');
                if (res.data.success) {
                    setStats(res.data.stats);
                }
            } catch (error) {
                console.error('Failed to load admin stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <AdminLayout>
            <div className="dashboard-content">
                <div className="welcome-bar" style={{ borderColor: 'var(--cyan-primary)' }}>
                    <h1 className="welcome-greet">
                        Welcome back, <span className="highlight-text">{adminUser?.full_name}</span> 🛡️
                    </h1>
                </div>

                {loading ? (
                    <div className="spinner mt-8"></div>
                ) : (
                    <div className="dashboard-grid">
                        <div className="stat-card" style={{ borderTop: '2px solid var(--purple-primary)' }}>
                            <div className="stat-icon" style={{ background: 'var(--purple-glow)', color: 'var(--purple-primary)' }}>👥</div>
                            <div className="stat-info">
                                <span className="stat-label">Total Users</span>
                                <strong className="stat-value">{stats.total_users}</strong>
                            </div>
                        </div>
                        <div className="stat-card" style={{ borderTop: '2px solid var(--cyan-primary)' }}>
                            <div className="stat-icon" style={{ background: 'var(--cyan-subtle)', color: 'var(--cyan-primary)' }}>👨‍⚖️</div>
                            <div className="stat-info">
                                <span className="stat-label">Advocates Verified</span>
                                <strong className="stat-value">{stats.verified_advocates}</strong>
                            </div>
                        </div>
                        <div className="stat-card" style={{ borderTop: '2px solid #d29922' }}>
                            <div className="stat-icon" style={{ background: 'rgba(210, 153, 34, 0.1)', color: '#d29922' }}>⏳</div>
                            <div className="stat-info">
                                <span className="stat-label">Pending Verification</span>
                                <strong className="stat-value">{stats.pending_verification}</strong>
                            </div>
                        </div>
                        <div className="stat-card" style={{ borderTop: '2px solid #238636' }}>
                            <div className="stat-icon" style={{ background: 'rgba(35, 134, 54, 0.1)', color: '#238636' }}>📞</div>
                            <div className="stat-info">
                                <span className="stat-label">Total Calls This Month</span>
                                <strong className="stat-value">{stats.total_calls_this_month}</strong>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
