import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import AvailabilityModal from '../../components/AvailabilityModal';


export default function ManageAdvocatesPage() {
    const [advocates, setAdvocates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [availabilityModal, setAvailabilityModal] = useState(null);

    const fetchAdvocates = async () => {
      setLoading(true);
      setError('');
      try {
        // Get admin token — try all possible keys
        const token = 
          localStorage.getItem('adminToken') ||
          localStorage.getItem('admin_token') ||
          localStorage.getItem('nyaya_admin_token');

        console.log('Admin token for advocates:', token ? 'FOUND' : 'MISSING');

        const response = await fetch(
          `http://localhost:5000/api/v1/admin/advocates?status=${filterStatus}&search=${searchTerm}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const data = await response.json();
        console.log('Advocates response:', data);

        if (response.ok) {
          setAdvocates(data.advocates || []);
        } else {
          console.error('Failed:', data.message);
          setError('Failed to fetch advocates');
        }
      } catch (err) {
        console.error('Failed to fetch advocates', err);
        setError('Cannot connect to server');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
        fetchAdvocates();
    }, [filterStatus, searchTerm]);

    const handleAction = async (id, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this advocate?`)) return;

        try {
            let res;
            if (action === 'delete') {
                res = await api.delete(`/v1/admin/advocates/${id}`);
            } else {
                res = await api.patch(`/v1/admin/advocates/${id}/${action}`);
            }

            if (res.data.success) {
                // Assuming we have a global toast mechanism, we'd fire it here.
                // For now, simple standard alert or just refresh.
                fetchAdvocates();
            }
        } catch (error) {
            alert(`Failed to ${action} advocate`);
        }
    };

    return (
        <AdminLayout>
            <div className="dashboard-content">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Manage Advocates</h2>
                    <Link to="/admin/advocates/add" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #00d4ff, #0088aa)' }}>
                        + Add Advocate
                    </Link>
                </div>

                <div className="card mb-6" style={{ padding: '16px', display: 'flex', gap: '16px', background: 'var(--bg-card)' }}>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="form-input flex-1"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                        className="form-input"
                        style={{ width: '200px' }}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="verified">Verified</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>

                <div className="card overflow-hidden">
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-input)' }}>
                                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Name</th>
                                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Practice Areas</th>
                                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Location</th>
                                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Rate</th>
                                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Status</th>
                                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Loading...</td>
                                    </tr>
                                )}
                                {!loading && advocates.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>No advocates found.</td>
                                    </tr>
                                )}
                                {!loading && advocates.map(adv => (
                                    <tr key={adv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{adv.full_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{adv.email}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {Array.isArray(adv.practice_areas) ? adv.practice_areas.join(', ') : adv.practice_areas}
                                        </td>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{adv.city}, {adv.state}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>₹{adv.hourly_rate}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
                                                background: adv.verification_status === 'verified' ? 'rgba(0, 212, 255, 0.1)'
                                                    : adv.verification_status === 'suspended' ? 'rgba(255, 68, 68, 0.1)'
                                                        : 'rgba(210, 153, 34, 0.1)',
                                                color: adv.verification_status === 'verified' ? 'var(--cyan-primary)'
                                                    : adv.verification_status === 'suspended' ? '#ff4444'
                                                        : '#d29922'
                                            }}>
                                                {adv.verification_status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                {/* Edit is a placeholder for now as per requirements */}
                                                <button className="btn btn-ghost" style={{ padding: '6px', fontSize: '1rem' }} title="Edit">✏️</button>
                                                <button
                                                    className="btn btn-ghost"
                                                    style={{ padding: '6px', fontSize: '1rem', opacity: adv.verification_status === 'verified' ? 0.3 : 1 }}
                                                    title="Verify"
                                                    disabled={adv.verification_status === 'verified'}
                                                    onClick={() => handleAction(adv.id, 'verify')}
                                                >✅</button>
                                                <button
                                                    className="btn btn-ghost"
                                                    style={{ padding: '6px', fontSize: '1rem', opacity: adv.verification_status === 'suspended' ? 0.3 : 1 }}
                                                    title="Suspend"
                                                    disabled={adv.verification_status === 'suspended'}
                                                    onClick={() => handleAction(adv.id, 'suspend')}
                                                >⏸️</button>
                                                <button
                                                  onClick={() => setAvailabilityModal(adv)}
                                                  title="Set Availability"
                                                  style={{
                                                    background: 'rgba(0,212,255,0.1)',
                                                    border: '1px solid rgba(0,212,255,0.3)',
                                                    color: '#00d4ff',
                                                    borderRadius: '6px',
                                                    padding: '6px 12px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                  }}
                                                >
                                                  🗓️ Set Availability
                                                </button>
                                                <button
                                                    className="btn btn-ghost"
                                                    style={{ padding: '6px', fontSize: '1rem' }}
                                                    title="Delete"
                                                    onClick={() => handleAction(adv.id, 'delete')}
                                                >🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {availabilityModal && (
              <AvailabilityModal
                advocate={availabilityModal}
                onClose={() => setAvailabilityModal(null)}
              />
            )}
        </AdminLayout>
    );
}
