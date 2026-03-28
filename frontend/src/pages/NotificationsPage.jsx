import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/Layout';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All'); // 'All', 'Unread', 'Appointments', 'Calls', 'Payments', 'Documents', 'System'

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/v1/notifications?limit=100');
            if (data.success) {
                setNotifications(data.data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const { data } = await api.put(`/v1/notifications/${id}/read`);
            if (data.success) {
                setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
            }
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/v1/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const clearAll = async () => {
        try {
            await api.delete('/v1/notifications/clear-all');
            setNotifications([]);
        } catch (err) {
            console.error('Error clearing notifications:', err);
        }
    };

    const dismissNotification = async (id) => {
        try {
            await api.delete(`/v1/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.notification_id !== id));
        } catch (err) {
            console.error('Error dismissing notification:', err);
        }
    };

    const handleActionClick = (e, n) => {
        e.stopPropagation();
        if (!n.is_read) markAsRead(n.notification_id);
        if (n.action_url) navigate(n.action_url);
    };

    const handleCardClick = (n) => {
        if (!n.is_read) markAsRead(n.notification_id);
        if (n.action_url) navigate(n.action_url);
    };

    const notificationConfig = {
        appointment_confirmed: { icon: '📅', color: '#00d4ff', bg: 'rgba(0,212,255,0.15)', label: 'Appointment' },
        appointment_reminder: { icon: '⏰', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Reminder' },
        appointment_cancelled: { icon: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'Appointment' },
        call_started: { icon: '📞', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', label: 'Call' },
        call_completed: { icon: '✅', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', label: 'Call' },
        payment_success: { icon: '💳', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', label: 'Payment' },
        payment_deducted: { icon: '💸', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'Payment' },
        refund_processed: { icon: '↩️', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', label: 'Payment' },
        document_shared: { icon: '📁', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Document' },
        document_received: { icon: '📨', color: '#7c3aed', bg: 'rgba(124,58,237,0.15)', label: 'Document' },
        low_balance: { icon: '⚠️', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'System' },
        system: { icon: '🔔', color: '#8b949e', bg: 'rgba(139,148,158,0.15)', label: 'System' }
    };

    const getTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const groupNotifications = (notifs) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        return {
            today: notifs.filter(n => {
                const d = new Date(n.created_at);
                d.setHours(0, 0, 0, 0);
                return d.getTime() === today.getTime();
            }),
            yesterday: notifs.filter(n => {
                const d = new Date(n.created_at);
                d.setHours(0, 0, 0, 0);
                return d.getTime() === yesterday.getTime();
            }),
            earlier: notifs.filter(n => {
                const d = new Date(n.created_at);
                d.setHours(0, 0, 0, 0);
                return d.getTime() < yesterday.getTime();
            })
        };
    };

    // Filter logic
    const filteredNotifications = notifications.filter(n => {
        if (filter === 'All') return true;
        if (filter === 'Unread') return !n.is_read;
        const config = notificationConfig[n.type] || notificationConfig['system'];
        return config.label === filter;
    });

    const grouped = groupNotifications(filteredNotifications);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const renderCard = (n) => {
        const config = notificationConfig[n.type] || notificationConfig['system'];
        const isUnread = !n.is_read;
        return (
            <div
                key={n.notification_id}
                onClick={() => handleCardClick(n)}
                style={{
                    background: isUnread ? '#161b22' : '#0d1117',
                    border: `1px solid ${isUnread ? 'rgba(0,212,255,0.2)' : '#21262d'}`,
                    borderRadius: '12px',
                    padding: '16px 20px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderLeft: isUnread ? '3px solid #00d4ff' : '3px solid transparent'
                }}
            >
                {/* Unread dot */}
                {isUnread && (
                    <div style={{
                        width: '8px', height: '8px',
                        borderRadius: '50%',
                        background: '#00d4ff',
                        marginTop: '6px',
                        flexShrink: 0
                    }} />
                )}

                {/* Icon circle */}
                <div style={{
                    width: '44px', height: '44px',
                    borderRadius: '50%',
                    background: config.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0
                }}>
                    {config.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                    <p style={{
                        color: 'white',
                        fontWeight: isUnread ? '600' : '400',
                        margin: '0 0 4px 0'
                    }}>
                        {n.title}
                    </p>
                    <p style={{
                        color: '#8b949e',
                        fontSize: '13px',
                        margin: '0 0 8px 0',
                        lineHeight: '1.5'
                    }}>
                        {n.message}
                    </p>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span style={{ color: '#6e7681', fontSize: '12px' }}>
                            {getTimeAgo(n.created_at)}
                        </span>
                        {n.action_url && (
                            <button
                                onClick={(e) => handleActionClick(e, n)}
                                style={{
                                    background: 'rgba(0,212,255,0.1)',
                                    border: '1px solid rgba(0,212,255,0.3)',
                                    color: '#00d4ff',
                                    borderRadius: '6px',
                                    padding: '4px 12px',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                View
                            </button>
                        )}
                    </div>
                </div>

                {/* Dismiss button */}
                <button
                    onClick={(e) => { e.stopPropagation(); dismissNotification(n.notification_id); }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6e7681',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '4px',
                        flexShrink: 0
                    }}
                >
                    ✕
                </button>
            </div>
        );
    };

    return (
        <Layout>
            <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ color: 'white', fontSize: '28px', margin: '0 0 4px 0', fontWeight: 'bold' }}>Notifications</h1>
                        <p style={{ color: '#8b949e', margin: 0 }}>Stay updated with your legal activities</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {notifications.length > 0 && (
                            <>
                                <button onClick={markAllRead} style={{ background: '#161b22', border: '1px solid #30363d', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                    Mark All Read
                                </button>
                                <button onClick={clearAll} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                    Clear All
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                {notifications.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid #21262d' }}>
                        {['All', `Unread ${unreadCount ? '🔴' + unreadCount : ''}`, 'Appointments', 'Calls', 'Payments', 'Documents', 'System'].map(tab => {
                            const tabValue = tab.startsWith('Unread') ? 'Unread' : tab;
                            const isActive = filter === tabValue;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setFilter(tabValue)}
                                    style={{
                                        background: isActive ? '#00d4ff' : 'transparent',
                                        color: isActive ? '#0d1117' : '#8b949e',
                                        border: isActive ? 'none' : '1px solid #30363d',
                                        padding: '6px 16px',
                                        borderRadius: '20px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: isActive ? '600' : '400',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {tab}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 24px', color: '#8b949e' }}>Loading notifications...</div>
                ) : notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔔</div>
                        <h3 style={{ color: 'white', marginBottom: '8px' }}>All caught up!</h3>
                        <p style={{ color: '#8b949e' }}>No notifications right now. We'll let you know when something happens.</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 24px', color: '#8b949e' }}>No notifications match the selected filter.</div>
                ) : (
                    <div>
                        {grouped.today.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ color: '#6e7681', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>Today</h4>
                                {grouped.today.map(renderCard)}
                            </div>
                        )}
                        {grouped.yesterday.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ color: '#6e7681', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>Yesterday</h4>
                                {grouped.yesterday.map(renderCard)}
                            </div>
                        )}
                        {grouped.earlier.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ color: '#6e7681', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>Earlier</h4>
                                {grouped.earlier.map(renderCard)}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </Layout>
    );
};

export default NotificationsPage;
