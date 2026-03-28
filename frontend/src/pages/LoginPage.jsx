import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('choose');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUserLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();
      console.log('Login response:', data);
      if (res.ok && data.access_token) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = 'http://localhost:5173/dashboard';
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Cannot connect to server. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();
      console.log('Admin login response:', data);
      if (res.ok) {
        const token = data.access_token || data.token;
        localStorage.setItem('adminToken', token);
        localStorage.setItem('admin_token', token);
        localStorage.setItem('nyaya_admin_token', token);
        localStorage.setItem('adminUser', JSON.stringify(data.user || {}));
        window.location.href = 'http://localhost:5173/admin/dashboard';
      } else {
        setError(data.message || 'Invalid admin credentials');
      }
    } catch (err) {
      setError('Cannot connect to server. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (focusColor) => ({
    width: '100%', padding: '12px 16px',
    background: '#0d1117', border: '1px solid #30363d',
    borderRadius: '10px', color: 'white', fontSize: '15px',
    outline: 'none', boxSizing: 'border-box'
  });

  const labelStyle = {
    color: '#8b949e', fontSize: '12px', fontWeight: '600',
    letterSpacing: '0.5px', display: 'block', marginBottom: '8px'
  };

  // CHOOSE SCREEN
  if (step === 'choose') return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', padding: '24px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '20px',
          background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px', margin: '0 auto 16px',
          boxShadow: '0 0 40px rgba(0,212,255,0.3)'
        }}>⚖️</div>
        <h1 style={{ color: 'white', fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0' }}>
          Nyaya
        </h1>
        <p style={{ color: '#8b949e', margin: 0 }}>India's Legal Advisory Platform</p>
      </div>

      <p style={{ color: '#8b949e', marginBottom: '32px', fontSize: '18px' }}>
        Who are you logging in as?
      </p>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          {
            type: 'user', icon: '👤', title: 'User',
            desc: 'Access your legal dashboard',
            btnText: 'Login as User →',
            color: '#00d4ff', bg: 'rgba(0,212,255,0.1)',
            border: 'rgba(0,212,255,0.3)'
          },
          {
            type: 'admin', icon: '🛡️', title: 'Admin',
            desc: 'Manage the platform',
            btnText: 'Login as Admin →',
            color: '#a78bfa', bg: 'rgba(124,58,237,0.1)',
            border: 'rgba(124,58,237,0.3)'
          }
        ].map(card => (
          <div key={card.type}
            onClick={() => { setStep(card.type); setError(''); setUsername(''); setPassword(''); }}
            style={{
              width: '240px', padding: '32px 24px',
              background: '#161b22', border: '1px solid #30363d',
              borderRadius: '16px', textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.border = `1px solid ${card.color}`;
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 8px 32px ${card.bg}`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.border = '1px solid #30363d';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{card.icon}</div>
            <h3 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '20px' }}>{card.title}</h3>
            <p style={{ color: '#8b949e', margin: 0, fontSize: '14px' }}>{card.desc}</p>
            <div style={{
              marginTop: '20px', padding: '10px',
              background: card.bg, border: `1px solid ${card.border}`,
              borderRadius: '8px', color: card.color,
              fontSize: '14px', fontWeight: '600'
            }}>{card.btnText}</div>
          </div>
        ))}
      </div>

      <p style={{ color: '#6e7681', marginTop: '32px', fontSize: '14px' }}>
        Don't have an account?{' '}
        <span onClick={() => navigate('/register')}
          style={{ color: '#00d4ff', cursor: 'pointer' }}>Register here</span>
      </p>
    </div>
  );

  // LOGIN FORM (user or admin)
  const isAdmin = step === 'admin';
  const accentColor = isAdmin ? '#7c3aed' : '#00d4ff';
  const accentBg = isAdmin
    ? 'linear-gradient(135deg, #0d1117 0%, #1a0d2e 100%)'
    : 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)';
  const btnBg = isAdmin
    ? 'linear-gradient(135deg, #7c3aed, #5b21b6)'
    : 'linear-gradient(135deg, #00d4ff, #0099bb)';
  const borderColor = isAdmin ? 'rgba(124,58,237,0.3)' : 'rgba(0,212,255,0.2)';
  const shadowColor = isAdmin ? 'rgba(124,58,237,0.15)' : 'rgba(0,212,255,0.1)';

  return (
    <div style={{
      minHeight: '100vh', background: accentBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', padding: '24px'
    }}>
      <div style={{
        width: '100%', maxWidth: '420px',
        background: '#161b22', border: `1px solid ${borderColor}`,
        borderRadius: '20px', padding: '40px',
        boxShadow: `0 0 60px ${shadowColor}`
      }}>
        <button onClick={() => { setStep('choose'); setError(''); }}
          style={{
            background: 'none', border: 'none', color: '#8b949e',
            cursor: 'pointer', fontSize: '14px', marginBottom: '24px',
            display: 'flex', alignItems: 'center', gap: '6px', padding: 0
          }}>← Back</button>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>
            {isAdmin ? '🛡️' : '👤'}
          </div>
          <h2 style={{ color: 'white', margin: '0 0 6px 0', fontSize: '24px', fontWeight: '700' }}>
            {isAdmin ? 'Admin Login' : 'User Login'}
          </h2>
          <p style={{ color: '#8b949e', margin: 0, fontSize: '14px' }}>
            {isAdmin ? 'Restricted access — authorized personnel only' : 'Access your legal dashboard'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
            color: '#ef4444', borderRadius: '8px',
            padding: '12px', marginBottom: '20px', fontSize: '14px'
          }}>⚠️ {error}</div>
        )}

        <form onSubmit={isAdmin ? handleAdminLogin : handleUserLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>
              {isAdmin ? 'ADMIN USERNAME' : 'USERNAME'}
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={isAdmin ? 'Enter admin username' : 'Enter your username'}
              required
              style={inputStyle(accentColor)}
              onFocus={e => e.target.style.border = `1px solid ${accentColor}`}
              onBlur={e => e.target.style.border = '1px solid #30363d'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>
              {isAdmin ? 'ADMIN PASSWORD' : 'PASSWORD'}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={inputStyle(accentColor)}
              onFocus={e => e.target.style.border = `1px solid ${accentColor}`}
              onBlur={e => e.target.style.border = '1px solid #30363d'}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px',
            background: loading ? '#333' : btnBg,
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '16px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : `0 4px 20px ${shadowColor}`
          }}>
            {loading ? '⏳ Please wait...' : (isAdmin ? 'Secure Login →' : 'Login →')}
          </button>
        </form>

        {!isAdmin && (
          <p style={{ color: '#6e7681', marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
            Don't have an account?{' '}
            <span onClick={() => navigate('/register')}
              style={{ color: '#00d4ff', cursor: 'pointer' }}>Register</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
