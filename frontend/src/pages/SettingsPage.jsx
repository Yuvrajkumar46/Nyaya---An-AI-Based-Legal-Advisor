import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../utils/api';

export default function SettingsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Profile Form State
    const [profileData, setProfileData] = useState({
        fullName: '',
        phone: '',
        preferredLanguage: 'English'
    });

    // Password Form State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Notifications Form State
    const [notificationsData, setNotificationsData] = useState({
        sms: true,
        inApp: true,
        appointments: true,
        billing: false
    });

    useEffect(() => {
        // Fetch user data for profile form prepopulate
        const fetchUserData = async () => {
            try {
                const res = await api.get('/v1/users/me');
                if (res.data?.data) {
                    setProfileData({
                        fullName: res.data.data.fullName || '',
                        phone: res.data.data.phone || '',
                        preferredLanguage: res.data.data.preferredLanguage || 'English'
                    });
                }
            } catch (error) {
                console.error("Failed to fetch user profile", error);
            }
        };
        fetchUserData();
    }, []);

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch('/v1/users/profile', profileData);
            showMessage('Profile updated successfully');
        } catch (error) {
            showMessage(error.response?.data?.message || 'Update failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return showMessage('Passwords do not match', 'error');
        }
        setLoading(true);
        try {
            await api.patch('/v1/users/password', passwordData);
            showMessage('Password updated successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            showMessage(error.response?.data?.message || 'Update failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationsSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch('/v1/users/notification-preferences', notificationsData);
            showMessage('Preferences saved');
        } catch (error) {
            showMessage('Failed to save preferences', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDataDeletion = async () => {
        if (window.confirm('Are you sure you want to request data deletion? This will delete all your records.')) {
            try {
                await api.post('/v1/users/delete-request');
                showMessage('Data deletion request submitted');
            } catch (error) {
                showMessage('Request failed', 'error');
            }
        }
    };

    const handleLogoutAll = async () => {
        try {
            await api.delete('/v1/auth/sessions/all');
            showMessage('Logged out from all other devices');
        } catch (error) {
            showMessage('Action failed', 'error');
        }
    };

    return (
        <Layout>
            <div className="settings-page">
                <div className="settings-header">
                    <h2>Settings</h2>
                    <p>Manage your account preferences and personal information.</p>
                </div>

                {message.text && (
                    <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '24px' }}>
                        {message.text}
                    </div>
                )}

                <div className="settings-container">
                    {/* Sidebar / Tabs */}
                    <div className="settings-tabs">
                        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                            👤 Profile
                        </button>
                        <button className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>
                            🔒 Password
                        </button>
                        <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                            🔔 Notifications
                        </button>
                        <button className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>
                            🛡️ Privacy & Sessions
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="settings-content">

                        {/* Tab 1: Profile */}
                        {activeTab === 'profile' && (
                            <div className="tab-pane active">
                                <h3>Profile Information</h3>
                                <form onSubmit={handleProfileSubmit} className="settings-form">
                                    <div className="form-group avatar-upload">
                                        <div className="avatar-preview">
                                            {user?.username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <button type="button" className="btn btn-ghost btn-sm">Upload Avatar</button>
                                    </div>
                                    <div className="form-group">
                                        <label>Username (Read Only)</label>
                                        <input type="text" value={user?.username || ''} disabled className="input-field disabled" />
                                    </div>
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            value={profileData.fullName}
                                            onChange={e => setProfileData({ ...profileData, fullName: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input
                                            type="text"
                                            value={profileData.phone}
                                            onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Preferred Language</label>
                                        <select
                                            value={profileData.preferredLanguage}
                                            onChange={e => setProfileData({ ...profileData, preferredLanguage: e.target.value })}
                                            className="input-field"
                                        >
                                            <option value="English">English</option>
                                            <option value="Hindi">Hindi (हिन्दी)</option>
                                            <option value="Marathi">Marathi (मराठी)</option>
                                            <option value="Tamil">Tamil (தமிழ்)</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Tab 2: Password */}
                        {activeTab === 'password' && (
                            <div className="tab-pane active">
                                <h3>Change Password</h3>
                                <div className="password-rules">
                                    <p><strong>Password must contain:</strong></p>
                                    <ul>
                                        <li>Minimum 12 characters</li>
                                        <li>At least 1 uppercase letter</li>
                                        <li>At least 1 number</li>
                                        <li>At least 1 special character</li>
                                    </ul>
                                </div>
                                <form onSubmit={handlePasswordSubmit} className="settings-form">
                                    <div className="form-group">
                                        <label>Current Password</label>
                                        <input
                                            type="password"
                                            required
                                            value={passwordData.currentPassword}
                                            onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            required
                                            value={passwordData.newPassword}
                                            onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Confirm New Password</label>
                                        <input
                                            type="password"
                                            required
                                            value={passwordData.confirmPassword}
                                            onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Updating...' : 'Update Password'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Tab 3: Notifications */}
                        {activeTab === 'notifications' && (
                            <div className="tab-pane active">
                                <h3>Notification Preferences</h3>
                                <form onSubmit={handleNotificationsSubmit} className="settings-form">
                                    <div className="toggle-group">
                                        <label className="toggle-label">
                                            <div>
                                                <strong>SMS Notifications</strong>
                                                <p>Receive updates via SMS</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={notificationsData.sms}
                                                onChange={e => setNotificationsData({ ...notificationsData, sms: e.target.checked })}
                                            />
                                        </label>
                                    </div>
                                    <div className="toggle-group">
                                        <label className="toggle-label">
                                            <div>
                                                <strong>In-app Notifications</strong>
                                                <p>Receive direct messages and alerts</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={notificationsData.inApp}
                                                onChange={e => setNotificationsData({ ...notificationsData, inApp: e.target.checked })}
                                            />
                                        </label>
                                    </div>
                                    <div className="toggle-group">
                                        <label className="toggle-label">
                                            <div>
                                                <strong>Appointment Reminders</strong>
                                                <p>Get notified before your scheduled consultations</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={notificationsData.appointments}
                                                onChange={e => setNotificationsData({ ...notificationsData, appointments: e.target.checked })}
                                            />
                                        </label>
                                    </div>
                                    <div className="toggle-group">
                                        <label className="toggle-label">
                                            <div>
                                                <strong>Billing Alerts</strong>
                                                <p>Receive invoices and payment receipts</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={notificationsData.billing}
                                                onChange={e => setNotificationsData({ ...notificationsData, billing: e.target.checked })}
                                            />
                                        </label>
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Saving...' : 'Save Preferences'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Tab 4: Privacy & Sessions */}
                        {activeTab === 'privacy' && (
                            <div className="tab-pane active privacy-tab">
                                <h3>DPDPA Compliance & Data</h3>
                                <p className="privacy-desc">Under the Digital Personal Data Protection Act 2023, you have full control over your data.</p>

                                <div className="data-consents">
                                    <h4>Active Consents</h4>
                                    <ul>
                                        <li>✓ Profiling and Personalization</li>
                                        <li>✓ AI Case Analysis History Retention</li>
                                        <li>✓ Communication logs sharing with Advocates</li>
                                    </ul>
                                </div>

                                <div className="danger-zone">
                                    <button className="btn btn-outline-danger" onClick={handleDataDeletion}>
                                        Request Data Deletion
                                    </button>
                                </div>

                                <h3 style={{ marginTop: '32px' }}>Active Sessions</h3>
                                <div className="sessions-list">
                                    <div className="session-item">
                                        <div className="session-info">
                                            <strong>Windows • Chrome (Current)</strong>
                                            <span>IP: 192.168.1.5 • Last active: Just now</span>
                                        </div>
                                    </div>
                                    <div className="session-item">
                                        <div className="session-info">
                                            <strong>Android • App</strong>
                                            <span>IP: 115.34.2.10 • Last active: 2 hours ago</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="btn btn-outline" onClick={handleLogoutAll} style={{ marginTop: '16px' }}>
                                    Logout All Other Devices
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
