import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const getStatusBadge = (status) => {
    switch (status) {
        case 'scheduled':
            return <div className="badge" style={{ backgroundColor: '#eab308' }}>SCHEDULED</div>;
        case 'confirmed':
            return <div className="badge" style={{ backgroundColor: '#22c55e' }}>CONFIRMED ✅</div>;
        case 'in_progress':
            return <div className="badge" style={{ backgroundColor: '#3b82f6', animation: 'pulse 2s infinite' }}>IN PROGRESS</div>;
        case 'completed':
            return <div className="badge" style={{ backgroundColor: '#6b7280' }}>COMPLETED</div>;
        case 'cancelled':
            return <div className="badge" style={{ backgroundColor: '#ef4444' }}>CANCELLED</div>;
        case 'no_show':
            return <div className="badge" style={{ backgroundColor: '#f97316' }}>NO SHOW</div>;
        default:
            return <div className="badge">{status.toUpperCase()}</div>;
    }
};

export default function AppointmentsPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('upcoming');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAppointments = async (status) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/v1/appointments?status=${status}`);
            setAppointments(data.appointments || []);
        } catch (err) {
            console.error('Failed to fetch appointments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments(activeTab);
    }, [activeTab]);

    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this appointment? Please check the refund policy first.")) return;
        try {
            const { data } = await api.patch(`/v1/appointments/${id}/cancel`);
            alert(`Appointment cancelled! Cancelled amount refunded to wallet: ₹${data.refund_amount}`);
            fetchAppointments(activeTab);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel appointment.');
        }
    };

    return (
        <div className="module-page" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-bright)' }}>My Appointments</h1>
                    <p style={{ color: 'var(--text-dim)' }}>Manage your legal consultations and video calls.</p>
                </div>
                <Link to="/find-advocates" className="btn btn-primary">
                    <span style={{ marginRight: '8px' }}>+</span> Book New
                </Link>
            </div>

            {/* Tabs */}
            <div className="tabs-container" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
                {['upcoming', 'past', 'cancelled'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '1rem 2rem',
                            color: activeTab === tab ? 'var(--primary)' : 'var(--text-dim)',
                            borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            fontSize: '1.1rem',
                            fontWeight: activeTab === tab ? '600' : '400',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Appointment List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
                    <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }}></div>
                    <p>Loading your appointments...</p>
                </div>
            ) : appointments.length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                    <h3 style={{ fontSize: '1.5rem', color: 'var(--text-bright)', marginBottom: '0.5rem' }}>No {activeTab} appointments</h3>
                    <p style={{ color: 'var(--text-dim)' }}>You don't have any {activeTab} consultations to show right now.</p>
                    {activeTab === 'upcoming' && (
                        <Link to="/find-advocates" className="btn btn-outline" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
                            Find an Advocate
                        </Link>
                    )}
                </div>
            ) : (
                <div className="appointments-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {appointments.map(appt => (
                        <div key={appt.appointment_id} className="appointment-card glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                            {/* Left Info */}
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <div className="avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--bg-tertiary), var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                    {appt.user_avatar ? <img src={appt.user_avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : '⚖️'}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-bright)', marginBottom: '0.2rem' }}>
                                        Adv. {appt.advocate_name || 'Legal Expert'}
                                    </h3>
                                    <p style={{ color: 'var(--primary)', fontWeight: '500', marginBottom: '1rem' }}>
                                        {appt.practice_area || 'General Law'}
                                    </p>

                                    <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ color: 'var(--primary)' }}>📅</span>
                                            {new Date(appt.scheduled_start_time).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ color: 'var(--primary)' }}>🕐</span>
                                            {new Date(appt.scheduled_start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} -
                                            {new Date(appt.scheduled_end_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ color: 'var(--primary)' }}>{appt.appointment_type === 'video' ? '📞' : '🎙️'}</span>
                                            {appt.appointment_type === 'video' ? 'Video Call' : 'Voice Call'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ color: 'var(--primary)' }}>💰</span>
                                            ₹{parseFloat(appt.amount).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                                {getStatusBadge(appt.status)}

                                {activeTab === 'upcoming' && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                            onClick={() => navigate(`/calls/join/${appt.appointment_id}`)}
                                        >
                                            {appt.status === 'in_progress' ? 'Join Call Now' : 'Join Call'}
                                        </button>
                                        <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                            Reschedule
                                        </button>
                                        <button className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'transparent', color: 'var(--error)', border: '1px solid var(--error)' }} onClick={() => handleCancel(appt.appointment_id)}>
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                {activeTab === 'past' && (
                                    <button
                                        className="btn btn-outline"
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', marginTop: '1rem' }}
                                        onClick={() => navigate('/calls')}
                                    >
                                        View Summary
                                    </button>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
