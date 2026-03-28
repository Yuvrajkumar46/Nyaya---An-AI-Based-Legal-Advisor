import { useState, useEffect } from 'react';

const AvailabilityModal = ({ advocate, onClose }) => {
  const [availability, setAvailability] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [newSlot, setNewSlot] = useState({
    day_of_week: 'Monday',
    start_time: '09:00',
    end_time: '17:00',
    slot_duration_minutes: 60
  });
  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const token =
    localStorage.getItem('adminToken') ||
    localStorage.getItem('admin_token') ||
    localStorage.getItem('nyaya_admin_token');

  const advocateId = advocate.id || advocate.advocate_id;
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/v1/admin/advocates/${advocateId}/availability`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setAvailability(data.availability || []);
        setBlockedDates(data.blocked_dates || []);
      }
    } catch (err) {
      console.error('Fetch availability error:', err);
    }
  };

  const addSlot = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/v1/admin/advocates/${advocateId}/availability`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(newSlot)
        }
      );
      if (res.ok) {
        setSuccess('Slot added!');
        fetchAvailability();
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {
      console.error('Add slot error:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSlot = async (id) => {
    try {
      await fetch(
        `http://localhost:5000/api/v1/admin/advocates/${advocateId}/availability/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      setAvailability(prev => prev.filter(s => s.availability_id !== id));
    } catch (err) {
      console.error('Delete slot error:', err);
    }
  };

  const addBlockedDate = async () => {
    if (!blockDate) return;
    try {
      await fetch(
        `http://localhost:5000/api/v1/admin/advocates/${advocateId}/block-date`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ blocked_date: blockDate, reason: blockReason })
        }
      );
      setBlockedDates(prev => [...prev, { blocked_date: blockDate, reason: blockReason }]);
      setBlockDate('');
      setBlockReason('');
    } catch (err) {
      console.error('Block date error:', err);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '16px', padding: '32px',
        width: '620px', maxWidth: '95vw',
        maxHeight: '85vh', overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: '20px' }}>
            🗓️ {advocate.full_name} — Set Availability
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: '#8b949e', fontSize: '22px', cursor: 'pointer'
          }}>✕</button>
        </div>

        {success && (
          <div style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid #22c55e',
            color: '#22c55e', borderRadius: '8px',
            padding: '10px', marginBottom: '16px'
          }}>✅ {success}</div>
        )}

        {/* Add New Slot */}
        <div style={{
          background: '#0d1117', borderRadius: '12px',
          padding: '20px', marginBottom: '24px'
        }}>
          <h3 style={{ color: '#00d4ff', margin: '0 0 16px 0', fontSize: '15px' }}>
            Add Available Time Slot
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ color: '#8b949e', fontSize: '12px', display: 'block', marginBottom: '6px' }}>DAY</label>
              <select
                value={newSlot.day_of_week}
                onChange={e => setNewSlot({...newSlot, day_of_week: e.target.value})}
                style={{ width: '100%', background: '#161b22', border: '1px solid #30363d', color: 'white', borderRadius: '8px', padding: '8px 12px' }}
              >
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#8b949e', fontSize: '12px', display: 'block', marginBottom: '6px' }}>SLOT DURATION</label>
              <select
                value={newSlot.slot_duration_minutes}
                onChange={e => setNewSlot({...newSlot, slot_duration_minutes: parseInt(e.target.value)})}
                style={{ width: '100%', background: '#161b22', border: '1px solid #30363d', color: 'white', borderRadius: '8px', padding: '8px 12px' }}
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
            <div>
              <label style={{ color: '#8b949e', fontSize: '12px', display: 'block', marginBottom: '6px' }}>START TIME</label>
              <input type="time" value={newSlot.start_time}
                onChange={e => setNewSlot({...newSlot, start_time: e.target.value})}
                style={{ width: '100%', background: '#161b22', border: '1px solid #30363d', color: 'white', borderRadius: '8px', padding: '8px 12px' }}
              />
            </div>
            <div>
              <label style={{ color: '#8b949e', fontSize: '12px', display: 'block', marginBottom: '6px' }}>END TIME</label>
              <input type="time" value={newSlot.end_time}
                onChange={e => setNewSlot({...newSlot, end_time: e.target.value})}
                style={{ width: '100%', background: '#161b22', border: '1px solid #30363d', color: 'white', borderRadius: '8px', padding: '8px 12px' }}
              />
            </div>
          </div>
          <button onClick={addSlot} disabled={loading} style={{
            marginTop: '16px', width: '100%',
            background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
            color: 'white', border: 'none', borderRadius: '8px',
            padding: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px'
          }}>
            {loading ? '⏳ Adding...' : '+ Add Slot'}
          </button>
        </div>

        {/* Current Availability */}
        <h3 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '16px' }}>Current Availability</h3>
        {availability.length === 0 ? (
          <p style={{ color: '#8b949e', marginBottom: '20px' }}>No availability set yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {availability.map(slot => (
              <div key={slot.availability_id} style={{
                background: '#0d1117', borderRadius: '8px',
                padding: '12px 16px', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <span style={{ color: '#00d4ff', fontWeight: '600' }}>{slot.day_of_week}</span>
                  <span style={{ color: '#8b949e', marginLeft: '12px' }}>{slot.start_time} — {slot.end_time}</span>
                  <span style={{ color: '#6e7681', marginLeft: '12px', fontSize: '13px' }}>({slot.slot_duration_minutes} min slots)</span>
                </div>
                <button onClick={() => deleteSlot(slot.availability_id)} style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#ef4444', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px'
                }}>Delete</button>
              </div>
            ))}
          </div>
        )}

        {/* Block Dates */}
        <div style={{ background: '#0d1117', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#ef4444', margin: '0 0 16px 0', fontSize: '15px' }}>🚫 Block a Date (Holiday/Leave)</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <input type="date" value={blockDate}
              onChange={e => setBlockDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{ flex: 1, background: '#161b22', border: '1px solid #30363d', color: 'white', borderRadius: '8px', padding: '8px 12px' }}
            />
            <input placeholder="Reason (optional)" value={blockReason}
              onChange={e => setBlockReason(e.target.value)}
              style={{ flex: 2, background: '#161b22', border: '1px solid #30363d', color: 'white', borderRadius: '8px', padding: '8px 12px' }}
            />
            <button onClick={addBlockedDate} style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer'
            }}>Block</button>
          </div>
          {blockedDates.map((b, i) => (
            <div key={i} style={{ color: '#8b949e', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid #21262d' }}>
              🚫 {b.blocked_date} {b.reason && `— ${b.reason}`}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityModal;
