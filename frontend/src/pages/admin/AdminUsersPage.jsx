import { useState, useEffect, useCallback } from 'react';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0, new_today: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [viewUser, setViewUser] = useState(null);
    const [editUser, setEditUser] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Add user form state
    const [addForm, setAddForm] = useState({ full_name: '', username: '', phone: '', password: '', role: 'user', wallet_balance: '0' });
    // Edit form state
    const [editForm, setEditForm] = useState({});

    const BASE = 'http://localhost:5000/api/v1/admin';

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ search, status: statusFilter, role: roleFilter, page, limit: 10 });
            const url = `${BASE}/users?${params}`;
            console.log('[fetchUsers] Fetching:', url);

            const res = await fetch(url); // No auth header — route is open
            console.log('[fetchUsers] Status:', res.status);

            const data = await res.json();
            console.log('[fetchUsers] Response:', data);

            if (res.ok) {
                setUsers(data.users || []);
                setTotalPages(data.total_pages || data.totalPages || 1);
                if (data.stats) setStats(data.stats);
            } else {
                setError(data.message || `Error ${res.status}`);
            }
        } catch (err) {
            console.error('[fetchUsers] Error:', err);
            setError('Cannot connect to backend. Is it running on port 5000?');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, roleFilter, page]);


    useEffect(() => {
        const t = setTimeout(fetchUsers, 300);
        return () => clearTimeout(t);
    }, [fetchUsers]);

    // ESC close modals
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') { setViewUser(null); setEditUser(null); setShowAddModal(false); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);


    const flash = (type, msg) => {

        if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
        else { setError(msg); setTimeout(() => setError(''), 4000); }
    };

    const toggleSuspend = async (user) => {
        const action = user.is_active ? 'suspend' : 'unsuspend';
        if (!window.confirm(`Are you sure you want to ${action} ${user.username}?`)) return;
        try {
            const res = await fetch(`${BASE}/users/${user.user_id}/suspend`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) { flash('success', `User ${action}ed`); fetchUsers(); }
            else { flash('error', 'Action failed'); }
        } catch { flash('error', 'Network error'); }
    };

    const deleteUser = async (user) => {
        if (!window.confirm(`Delete ${user.username}? This cannot be undone.`)) return;
        try {
            const res = await fetch(`${BASE}/users/${user.user_id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) { flash('success', 'User deleted'); fetchUsers(); }
            else { flash('error', 'Delete failed'); }
        } catch { flash('error', 'Network error'); }
    };

    const handleAdd = async () => {
        if (!addForm.full_name || !addForm.username || !addForm.password) {
            return flash('error', 'Full name, username, and password are required');
        }
        try {
            const res = await fetch(`${BASE}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addForm)
            });
            const data = await res.json();
            if (res.ok) {
                flash('success', 'User created successfully');
                setShowAddModal(false);
                setAddForm({ full_name: '', username: '', phone: '', password: '', role: 'user', wallet_balance: '0' });
                fetchUsers();
            } else {
                flash('error', data.message || 'Failed to create user');
            }
        } catch { flash('error', 'Network error'); }
    };

    const handleEdit = async () => {
        try {
            const id = editUser.user_id || editUser.id;
            const res = await fetch(`${BASE}/users/${id}`, { 
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(editForm) 
            });
            const data = await res.json();
            if (res.ok) {
                flash('success', 'User updated');
                setEditUser(null);
                fetchUsers();
            } else {
                flash('error', data.message || 'Update failed');
            }
        } catch { flash('error', 'Network error'); }
    };

    // ─── Styles ───────────────────────────────────────────────────────────────
    const inputStyle = {
        width: '100%', background: '#0d1117', border: '1px solid #30363d',
        color: 'white', borderRadius: '8px', padding: '10px 14px',
        fontSize: '14px', boxSizing: 'border-box'
    };
    const btnStyle = (color) => ({
        background: `${color}22`, border: `1px solid ${color}55`,
        color, borderRadius: '6px', padding: '6px 10px',
        cursor: 'pointer', fontSize: '14px', lineHeight: 1
    });
    const modalOverlay = {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    };
    const modalBox = {
        background: '#161b22', border: '1px solid #30363d',
        borderRadius: '16px', padding: '32px', width: '480px',
        maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto'
    };

    return (
        <div style={{ background: '#0d1117', minHeight: '100vh', padding: '32px', fontFamily: 'Inter, sans-serif' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '28px' }}>Manage Users</h1>
                    <p style={{ color: '#8b949e', margin: 0 }}>View and manage all registered users</p>
                </div>
                <button onClick={() => setShowAddModal(true)} style={{
                    background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                    color: 'white', border: 'none', borderRadius: '10px',
                    padding: '12px 24px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer'
                }}>
                    + Add User
                </button>
            </div>

            {/* Alerts */}
            {success && (
                <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', color: '#22c55e', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                    ✅ {success}
                </div>
            )}
            {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                    ❌ {error}
                </div>
            )}

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                {[
                    { label: 'Total Users', value: stats.total, color: '#00d4ff', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.2)', icon: '👥' },
                    { label: 'Active Users', value: stats.active, color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', icon: '✅' },
                    { label: 'Suspended', value: stats.suspended, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: '🚫' },
                    { label: 'New Today', value: stats.new_today, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)', icon: '🆕' },
                ].map(s => (
                    <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '12px', padding: '20px' }}>
                        <p style={{ color: '#8b949e', margin: '0 0 8px 0', fontSize: '13px' }}>{s.icon} {s.label}</p>
                        <h2 style={{ color: s.color, margin: 0, fontSize: '32px', fontWeight: '700' }}>{s.value}</h2>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search by name / username / phone..."
                    style={{ ...inputStyle, flex: 1, minWidth: '250px' }}
                />
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    style={{ ...inputStyle, width: 'auto' }}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                </select>
                <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                    style={{ ...inputStyle, width: 'auto' }}>
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="advocate">Advocate</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            {/* Table */}
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #30363d' }}>
                            {['Avatar', 'Name / Username', 'Phone', 'Role', 'Wallet', 'Joined', 'Status', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: '#8b949e', fontSize: '13px', fontWeight: '600' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#8b949e' }}>Loading...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#8b949e' }}>No users found</td></tr>
                        ) : users.map(user => {
                            const uid = user.user_id || user.id;
                            return (
                                <tr key={uid}
                                    style={{ borderBottom: '1px solid #21262d', transition: 'background 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#1c2128'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{
                                            width: '38px', height: '38px', borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 'bold', fontSize: '15px'
                                        }}>
                                            {(user.full_name || user.username || '?')[0].toUpperCase()}
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <p style={{ color: 'white', margin: '0 0 2px 0', fontWeight: '600' }}>{user.full_name || '—'}</p>
                                        <p style={{ color: '#8b949e', margin: 0, fontSize: '13px' }}>@{user.username}</p>
                                    </td>
                                    <td style={{ color: '#8b949e', padding: '14px 16px', fontSize: '14px' }}>{user.phone || '—'}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                                            background: user.role === 'admin' ? 'rgba(124,58,237,0.2)' : 'rgba(0,212,255,0.1)',
                                            color: user.role === 'admin' ? '#a78bfa' : '#00d4ff',
                                            border: `1px solid ${user.role === 'admin' ? 'rgba(124,58,237,0.4)' : 'rgba(0,212,255,0.3)'}`
                                        }}>
                                            {(user.role || 'user').toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ color: '#22c55e', padding: '14px 16px', fontWeight: '600' }}>
                                        ₹{Number(user.wallet_balance || 0).toFixed(2)}
                                    </td>
                                    <td style={{ color: '#8b949e', padding: '14px 16px', fontSize: '13px' }}>
                                        {new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                                            background: user.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                            color: user.is_active ? '#22c55e' : '#ef4444',
                                            border: `1px solid ${user.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
                                        }}>
                                            {user.is_active ? '● ACTIVE' : '● SUSPENDED'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button onClick={() => setViewUser(user)} style={btnStyle('#00d4ff')} title="View">👁</button>
                                            <button onClick={() => { setEditUser(user); setEditForm({ full_name: user.full_name, phone: user.phone || '', role: user.role, wallet_balance: user.wallet_balance || '0', new_password: '' }); }} style={btnStyle('#f59e0b')} title="Edit">✏️</button>
                                            <button onClick={() => toggleSuspend(user)} style={btnStyle(user.is_active ? '#ef4444' : '#22c55e')} title={user.is_active ? 'Suspend' : 'Unsuspend'}>
                                                {user.is_active ? '🚫' : '✅'}
                                            </button>
                                            <button onClick={() => deleteUser(user)} style={btnStyle('#ef4444')} title="Delete">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #30363d', cursor: 'pointer', background: '#161b22', color: 'white' }}>← Prev</button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const p = page <= 3 ? i + 1 : page + i - 2;
                        if (p < 1 || p > totalPages) return null;
                        return (
                            <button key={p} onClick={() => setPage(p)} style={{
                                padding: '8px 14px', borderRadius: '8px', border: '1px solid #30363d',
                                cursor: 'pointer', background: p === page ? '#00d4ff' : '#161b22',
                                color: p === page ? '#000' : 'white', fontWeight: p === page ? 'bold' : 'normal'
                            }}>{p}</button>
                        );
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #30363d', cursor: 'pointer', background: '#161b22', color: 'white' }}>Next →</button>
                </div>
            )}

            {/* ─── VIEW MODAL ──────────────────────────────────────────────────────── */}
            {viewUser && (
                <div style={modalOverlay} onClick={() => setViewUser(null)}>
                    <div style={modalBox} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ color: 'white', margin: 0 }}>User Details</h2>
                            <button onClick={() => setViewUser(null)} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: '28px', fontWeight: 'bold', margin: '0 auto 12px'
                            }}>
                                {(viewUser.full_name || viewUser.username || '?')[0].toUpperCase()}
                            </div>
                            <h3 style={{ color: 'white', margin: '0 0 4px 0' }}>{viewUser.full_name || '—'}</h3>
                            <p style={{ color: '#8b949e', margin: 0 }}>@{viewUser.username}</p>
                        </div>
                        {[
                            ['Phone', viewUser.phone || '—'],
                            ['Role', (viewUser.role || 'user').toUpperCase()],
                            ['Wallet Balance', `₹${Number(viewUser.wallet_balance || 0).toFixed(2)}`],
                            ['Status', viewUser.is_active ? '● Active' : '● Suspended'],
                            ['Member Since', new Date(viewUser.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })],
                        ].map(([label, value]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #21262d' }}>
                                <span style={{ color: '#8b949e' }}>{label}</span>
                                <span style={{ color: 'white', fontWeight: '600' }}>{value}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button onClick={() => {
                                setEditUser(viewUser);
                                setEditForm({ full_name: viewUser.full_name, phone: viewUser.phone || '', role: viewUser.role, wallet_balance: viewUser.wallet_balance || '0', new_password: '' });
                                setViewUser(null);
                            }} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                ✏️ Edit User
                            </button>
                            <button onClick={() => setViewUser(null)} style={{ flex: 1, padding: '12px', background: '#21262d', color: 'white', border: '1px solid #30363d', borderRadius: '8px', cursor: 'pointer' }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── EDIT MODAL ──────────────────────────────────────────────────────── */}
            {editUser && (
                <div style={modalOverlay} onClick={() => setEditUser(null)}>
                    <div style={modalBox} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ color: 'white', margin: 0 }}>Edit — @{editUser.username}</h2>
                            <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>
                        {[
                            { label: 'Full Name', key: 'full_name', type: 'text' },
                            { label: 'Phone', key: 'phone', type: 'text' },
                            { label: 'Wallet Balance (₹)', key: 'wallet_balance', type: 'number' },
                            { label: 'New Password (leave blank to keep)', key: 'new_password', type: 'password' },
                        ].map(f => (
                            <div key={f.key} style={{ marginBottom: '16px' }}>
                                <label style={{ color: '#8b949e', fontSize: '13px', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                                <input type={f.type} value={editForm[f.key] || ''} onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle} />
                            </div>
                        ))}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ color: '#8b949e', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Role</label>
                            <select value={editForm.role || 'user'} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))} style={inputStyle}>
                                <option value="user">User</option>
                                <option value="advocate">Advocate</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button onClick={handleEdit} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Save Changes
                            </button>
                            <button onClick={() => setEditUser(null)} style={{ flex: 1, padding: '12px', background: '#21262d', color: 'white', border: '1px solid #30363d', borderRadius: '8px', cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── ADD MODAL ───────────────────────────────────────────────────────── */}
            {showAddModal && (
                <div style={modalOverlay} onClick={() => setShowAddModal(false)}>
                    <div style={modalBox} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ color: 'white', margin: 0 }}>Add New User</h2>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>
                        {[
                            { label: 'Full Name *', key: 'full_name', type: 'text' },
                            { label: 'Username *', key: 'username', type: 'text' },
                            { label: 'Phone', key: 'phone', type: 'text' },
                            { label: 'Password *', key: 'password', type: 'password' },
                            { label: 'Initial Wallet Balance (₹)', key: 'wallet_balance', type: 'number' },
                        ].map(f => (
                            <div key={f.key} style={{ marginBottom: '16px' }}>
                                <label style={{ color: '#8b949e', fontSize: '13px', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                                <input type={f.type} value={addForm[f.key] || ''} onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle} />
                            </div>
                        ))}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ color: '#8b949e', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Role</label>
                            <select value={addForm.role} onChange={e => setAddForm(p => ({ ...p, role: e.target.value }))} style={inputStyle}>
                                <option value="user">User</option>
                                <option value="advocate">Advocate</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button onClick={handleAdd} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Create User
                            </button>
                            <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '12px', background: '#21262d', color: 'white', border: '1px solid #30363d', borderRadius: '8px', cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;
