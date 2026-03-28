import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../utils/api';

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [userInfo, setUserInfo] = useState(null);
    const [stats, setStats] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [userRes, statsRes, aptRes, billRes, unreadRes] = await Promise.all([
                    api.get('/v1/users/me'),
                    api.get('/v1/users/stats'),
                    api.get('/v1/appointments?status=upcoming'),
                    api.get('/v1/billing/transactions?limit=3'),
                    api.get('/v1/notifications/unread-count')
                ]);

                setUserInfo(userRes.data?.data);
                setStats(statsRes.data?.data);
                setAppointments(aptRes.data?.appointments || []);
                setTransactions(billRes.data?.transactions || []);
                setTotalSpent(billRes.data?.total_spent || 0);
                setUnreadCount(unreadRes.data?.count || 0);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                // Optionally handle error visually
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const roleBadgeClass = {
        USER: 'badge badge-user',
        ADVOCATE: 'badge badge-advocate',
        ADMIN: 'badge badge-admin',
        DIRECTOR: 'badge badge-admin',
    }[user?.role] || 'badge badge-user';

    if (loading) {
        return (
            <Layout>
                <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
                    <span className="spinner" style={{ borderTopColor: 'var(--cyan-primary)', borderColor: 'var(--border)' }}></span>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="dashboard-content">

                {/* SECTION 1 - Top Welcome Bar */}
                <div className="welcome-bar">
                    <div className="welcome-greet">
                        Welcome back, <span className="highlight-text">{user?.username}</span>
                        <span className={roleBadgeClass} style={{ marginLeft: '12px' }}>{user?.role}</span>
                    </div>

                    <div className="welcome-actions">
                        <div className="wallet-card">
                            <span className="wallet-dot"></span>
                            <span className="wallet-balance">₹ {Number(userInfo?.walletBalance || 0).toFixed(2)}</span>
                            <button className="btn btn-sm" onClick={() => navigate('/billing/add-money')} style={{ background: 'var(--purple-gradient)' }}>Add Money</button>
                        </div>
                        <div style={{ position: 'relative', cursor: 'pointer', marginLeft: '12px' }}
                            onClick={() => navigate('/notifications')}
                        >
                            <div style={{
                                width: '44px', height: '44px',
                                borderRadius: '50%',
                                background: '#161b22',
                                border: '1px solid #30363d',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px'
                            }}>
                                🔔
                            </div>
                            {unreadCount > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-4px', right: '-4px',
                                    background: '#ef4444',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '20px', height: '20px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid #0d1117'
                                }}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SECTION 2 - Quick Stats Row */}
                <div className="dashboard-grid">
                    <div className="stat-card" onClick={() => navigate('/appointments')} style={{ cursor: 'pointer' }}>
                        <div className="stat-icon">📅</div>
                        <div className="stat-info">
                            <div className="stat-label">Upcoming Appointments</div>
                            <div className="stat-value">{stats?.upcomingAppointments || 0}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🤖</div>
                        <div className="stat-info">
                            <div className="stat-label">AI Queries Used</div>
                            <div className="stat-value">{stats?.aiQueriesUsed || 0}</div>
                        </div>
                    </div>
                    <div className="stat-card" onClick={() => navigate('/documents')} style={{ cursor: 'pointer' }}>
                        <div className="stat-icon">📁</div>
                        <div className="stat-info">
                            <div className="stat-label">Documents Uploaded</div>
                            <div className="stat-value">{stats?.documentsUploaded || 0}</div>
                        </div>
                    </div>
                    <div className="stat-card" onClick={() => navigate('/billing')} style={{ cursor: 'pointer' }}>
                        <div className="stat-icon">💳</div>
                        <div className="stat-info">
                            <div className="stat-label">Total Spent</div>
                            <div className="stat-value">₹ {totalSpent}</div>
                        </div>
                    </div>
                </div>

                {/* SECTION 3 - Two Column Layout */}
                <div className="two-col-layout">
                    {/* Left Column - Appointments */}
                    <div className="list-panel">
                        <div className="panel-header">
                            <h3>Upcoming Appointments</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/appointments')}>View All</button>
                        </div>
                        <div className="panel-content">
                            {appointments.length > 0 ? (
                                <ul className="item-list">
                                    {appointments.slice(0, 3).map(apt => (
                                        <li key={apt.appointment_id} className="list-item">
                                            <div className="item-details">
                                                <strong>{apt.advocate_name}</strong>
                                                <div className="meta">
                                                    <span>{new Date(apt.scheduled_start_time).toLocaleDateString()} {new Date(apt.scheduled_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span>•</span>
                                                    <span>{apt.appointment_type === 'video' ? 'Video' : 'Voice'}</span>
                                                </div>
                                            </div>
                                            <div className={`badge ${apt.status === 'scheduled' ? 'badge-user' : 'badge-advocate'}`}>
                                                {apt.status.toUpperCase()}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="empty-state">
                                    <p>No upcoming appointments.</p>
                                    <button className="btn btn-link" onClick={() => navigate('/find-advocates')}>Browse Advocates →</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Recent Transactions */}
                    <div className="list-panel">
                        <div className="panel-header">
                            <h3>Recent Transactions</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/billing')}>View All</button>
                        </div>
                        <div className="panel-content">
                            {transactions.length > 0 ? (
                                <ul className="item-list">
                                    {transactions.map(txn => {
                                        const isCredit = txn.transaction_type === 'credit';
                                        return (
                                            <li key={txn.transaction_id} className="list-item flex-col items-start gap-1">
                                                <div className="flex justify-between w-full">
                                                    <strong className="text-gray-200">{txn.description}</strong>
                                                    <span className={`font-bold ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                                                        {isCredit ? '+' : '-'} ₹{Number(txn.amount).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="meta justify-between w-full mt-1">
                                                    <span>{new Date(txn.created_at).toLocaleDateString()}</span>
                                                    <span className="badge badge-admin">{txn.status.toUpperCase()}</span>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="empty-state">
                                    <p>No transactions yet.</p>
                                    <button className="btn btn-link" onClick={() => navigate('/billing/add-money')}>Add Money to Wallet →</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SECTION 4 - Quick Action Buttons */}
                <div className="quick-actions-section">
                    <h3>Quick Actions</h3>
                    <div className="quick-actions-grid">
                        <button className="action-btn primary" onClick={() => navigate('/ai-guidance')}>
                            <span className="icon">🤖</span> Start AI Case Analysis
                        </button>
                        <button className="action-btn" onClick={() => navigate('/find-advocates')}>
                            <span className="icon">👨‍⚖️</span> Find an Advocate
                        </button>
                        <button className="action-btn" onClick={() => navigate('/documents/upload')}>
                            <span className="icon">📁</span> Upload Document
                        </button>
                        <button className="action-btn" onClick={() => navigate('/appointments')}>
                            <span className="icon">📅</span> View Appointments
                        </button>
                    </div>
                </div>

            </div>
        </Layout >
    );
}
