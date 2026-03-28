import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { loginAdmin } = useAdminAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await loginAdmin(username, password);

        if (result.success) {
            navigate('/admin/dashboard', { replace: true });
        } else {
            setError(result.message || 'Invalid admin credentials');
            setLoading(false);
        }
    };

    return (
        <div className="auth-page" style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0, 212, 255, 0.08) 0%, transparent 70%), var(--bg-primary)'
        }}>
            <div className="auth-card" style={{ borderColor: 'rgba(0, 212, 255, 0.3)', boxShadow: '0 0 40px rgba(0, 212, 255, 0.1)' }}>
                <div className="auth-logo">
                    <div className="auth-logo-icon" style={{ background: 'var(--bg-input)', border: '1px solid var(--cyan-primary)' }}>🛡️</div>
                    <h1 className="auth-title text-cyan">Admin Panel</h1>
                    <p className="auth-subtitle">Restricted access system</p>
                </div>

                {error && <div className="alert alert-error mb-4">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label text-cyan">Admin Username</label>
                        <input
                            type="text"
                            className="form-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter admin username"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label text-cyan">Admin Password</label>
                        <div className="relative flex items-center">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter secure password"
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 text-dim hover:text-cyan"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'absolute', right: '12px' }}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary mt-4"
                        disabled={loading}
                        style={{ background: 'linear-gradient(135deg, #00d4ff, #0088aa)' }}
                    >
                        {loading ? 'Authenticating...' : 'Secure Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
