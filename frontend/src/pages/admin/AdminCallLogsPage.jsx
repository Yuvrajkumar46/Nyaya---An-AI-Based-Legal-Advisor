import { useState, useEffect } from 'react';

const AdminCallLogsPage = () => {
  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState({
    total_calls: 0,
    active_calls: 0,
    total_revenue: 0,
    avg_duration: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewCall, setViewCall] = useState(null);
  const [error, setError] = useState('');

  const fetchCalls = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        search, status: statusFilter,
        date: dateFilter, page, limit: 10
      });
      const res = await fetch(
        `http://localhost:5000/api/v1/admin/calls?${params}`
      );
      const data = await res.json();
      if (res.ok) {
        setCalls(data.calls || []);
        setTotalPages(data.total_pages || 1);
        if (data.stats) setStats(data.stats);
      } else {
        setError(data.message || 'Failed to load calls');
      }
    } catch (err) {
      setError('Cannot connect to server. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCalls(); }, [search, statusFilter, dateFilter, page]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const statusColor = {
    completed: '#22c55e',
    active: '#00d4ff',
    missed: '#ef4444',
    failed: '#ef4444',
    ongoing: '#f59e0b'
  };

  const statusBg = {
    completed: 'rgba(34,197,94,0.15)',
    active: 'rgba(0,212,255,0.15)',
    missed: 'rgba(239,68,68,0.15)',
    failed: 'rgba(239,68,68,0.15)',
    ongoing: 'rgba(245,158,11,0.15)'
  };

  return (
    <div style={{
      background: '#0d1117', minHeight: '100vh',
      padding: '32px', fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '28px' }}>
          Call Logs
        </h1>
        <p style={{ color: '#8b949e', margin: 0 }}>
          Monitor all calls between users and advocates
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
          color: '#ef4444', borderRadius: '8px',
          padding: '12px 16px', marginBottom: '16px'
        }}>❌ {error}</div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Calls', value: stats.total_calls, color: '#00d4ff', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.2)', icon: '📞' },
          { label: 'Active Now', value: stats.active_calls, color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', icon: '🟢' },
          { label: 'Total Revenue', value: `₹${Number(stats.total_revenue || 0).toFixed(2)}`, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: '💰' },
          { label: 'Avg Duration', value: formatDuration(stats.avg_duration), color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)', icon: '⏱️' },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: '12px', padding: '24px', flex: 1
          }}>
            <p style={{ color: '#8b949e', margin: '0 0 8px 0', fontSize: '13px' }}>
              {s.icon} {s.label}
            </p>
            <h2 style={{ color: s.color, margin: 0, fontSize: '28px', fontWeight: '700' }}>
              {s.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by user or advocate name..."
          style={{
            flex: 1, minWidth: '250px',
            background: '#161b22', border: '1px solid #30363d',
            color: 'white', borderRadius: '8px', padding: '10px 16px', fontSize: '14px'
          }}
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{
            background: '#161b22', border: '1px solid #30363d',
            color: 'white', borderRadius: '8px', padding: '10px 16px', fontSize: '14px'
          }}
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="active">Active</option>
          <option value="missed">Missed</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={dateFilter}
          onChange={e => { setDateFilter(e.target.value); setPage(1); }}
          style={{
            background: '#161b22', border: '1px solid #30363d',
            color: 'white', borderRadius: '8px', padding: '10px 16px', fontSize: '14px'
          }}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Table */}
      <div style={{
        background: '#161b22', border: '1px solid #30363d',
        borderRadius: '16px', overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #30363d' }}>
              {['#', 'User', 'Advocate', 'Duration', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '14px 16px', textAlign: 'left',
                  color: '#8b949e', fontSize: '13px', fontWeight: '600'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#8b949e' }}>
                Loading calls...
              </td></tr>
            ) : calls.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '60px', color: '#8b949e' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📞</div>
                <p>No call logs found</p>
              </td></tr>
            ) : calls.map((call, idx) => (
              <tr key={call.call_id}
                style={{ borderBottom: '1px solid #21262d', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1c2128'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 16px', color: '#6e7681', fontSize: '13px' }}>
                  #{(page - 1) * 10 + idx + 1}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px'
                  }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 'bold', fontSize: '13px', flexShrink: 0
                    }}>
                      {(call.user_name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{ color: 'white', margin: 0, fontSize: '14px', fontWeight: '500' }}>
                        {call.user_name || 'Unknown'}
                      </p>
                      <p style={{ color: '#8b949e', margin: 0, fontSize: '12px' }}>
                        @{call.username || '—'}
                      </p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <p style={{ color: 'white', margin: 0, fontSize: '14px', fontWeight: '500' }}>
                    {call.advocate_name || 'Unknown'}
                  </p>
                  <p style={{ color: '#8b949e', margin: 0, fontSize: '12px' }}>
                    ₹{Number(call.hourly_rate || 0).toFixed(0)}/hr
                  </p>
                </td>
                <td style={{ padding: '14px 16px', color: '#00d4ff', fontWeight: '600' }}>
                  {formatDuration(call.duration_seconds || call.seconds_elapsed)}
                </td>
                <td style={{ padding: '14px 16px', color: '#22c55e', fontWeight: '600' }}>
                  ₹{Number(call.amount_charged || 0).toFixed(2)}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                    background: statusBg[call.status] || 'rgba(139,148,158,0.15)',
                    color: statusColor[call.status] || '#8b949e',
                    border: `1px solid ${statusColor[call.status] || '#8b949e'}44`
                  }}>
                    ● {(call.status || 'unknown').toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: '#8b949e', fontSize: '13px' }}>
                  {new Date(call.started_at || call.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                  <br />
                  <span style={{ fontSize: '12px' }}>
                    {new Date(call.started_at || call.created_at).toLocaleTimeString('en-IN', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <button
                    onClick={() => setViewCall(call)}
                    style={{
                      background: 'rgba(0,212,255,0.1)',
                      border: '1px solid rgba(0,212,255,0.3)',
                      color: '#00d4ff', borderRadius: '6px',
                      padding: '6px 12px', cursor: 'pointer', fontSize: '13px'
                    }}
                  >
                    👁 View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 16px', borderRadius: '8px',
              border: '1px solid #30363d', background: '#161b22',
              color: page === 1 ? '#6e7681' : 'white', cursor: page === 1 ? 'default' : 'pointer'
            }}
          >← Prev</button>
          <span style={{ color: 'white', padding: '8px 16px' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '8px 16px', borderRadius: '8px',
              border: '1px solid #30363d', background: '#161b22',
              color: page === totalPages ? '#6e7681' : 'white',
              cursor: page === totalPages ? 'default' : 'pointer'
            }}
          >Next →</button>
        </div>
      )}

      {/* View Call Modal */}
      {viewCall && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setViewCall(null)}>
          <div style={{
            background: '#161b22', border: '1px solid #30363d',
            borderRadius: '16px', padding: '32px', width: '500px', maxWidth: '90vw'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ color: 'white', margin: 0 }}>📞 Call Details</h2>
              <button onClick={() => setViewCall(null)} style={{
                background: 'none', border: 'none', color: '#8b949e', fontSize: '20px', cursor: 'pointer'
              }}>✕</button>
            </div>
            <div style={{
              background: '#0d1117', borderRadius: '12px', padding: '20px', marginBottom: '20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <p style={{ color: '#8b949e', margin: '0 0 4px 0', fontSize: '13px' }}>Call ID</p>
                <p style={{ color: '#00d4ff', margin: 0, fontSize: '13px', fontFamily: 'monospace' }}>
                  {viewCall.call_id?.substring(0, 18)}...
                </p>
              </div>
              <span style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                background: statusBg[viewCall.status] || 'rgba(139,148,158,0.15)',
                color: statusColor[viewCall.status] || '#8b949e'
              }}>
                ● {(viewCall.status || 'unknown').toUpperCase()}
              </span>
            </div>
            {[
              ['👤 User', viewCall.user_name || 'Unknown'],
              ['👨⚖️ Advocate', viewCall.advocate_name || 'Unknown'],
              ['⏱️ Duration', formatDuration(viewCall.duration_seconds || viewCall.seconds_elapsed)],
              ['💰 Amount Charged', `₹${Number(viewCall.amount_charged || 0).toFixed(2)}`],
              ['📅 Started At', viewCall.started_at ? new Date(viewCall.started_at).toLocaleString('en-IN') : '—'],
              ['📅 Ended At', viewCall.ended_at ? new Date(viewCall.ended_at).toLocaleString('en-IN') : '—'],
              ['💳 Rate', `₹${Number(viewCall.hourly_rate || 0).toFixed(0)}/hour`],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid #21262d'
              }}>
                <span style={{ color: '#8b949e' }}>{label}</span>
                <span style={{ color: 'white', fontWeight: '600' }}>{value}</span>
              </div>
            ))}
            <button onClick={() => setViewCall(null)} style={{
              width: '100%', marginTop: '20px', padding: '12px',
              background: '#21262d', color: 'white',
              border: '1px solid #30363d', borderRadius: '8px', cursor: 'pointer'
            }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCallLogsPage;
