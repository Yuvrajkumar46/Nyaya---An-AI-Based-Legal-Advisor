import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const getPasswordStrength = (pass) => {
    if (pass.length === 0) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    const map = [
        { label: 'Weak', color: '#ef4444' },
        { label: 'Fair', color: '#f59e0b' },
        { label: 'Good', color: '#3b82f6' },
        { label: 'Strong', color: '#22c55e' },
        { label: 'Very Strong', color: '#10b981' },
    ];
    return { score, ...map[score] };
};

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', role: 'USER', fullName: '', email: '', phone: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const strength = getPasswordStrength(form.password);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (form.username.trim().length < 3)
            return setError('Username must be at least 3 characters.');
        if (!/^[a-zA-Z0-9_]+$/.test(form.username))
            return setError('Username can only contain letters, numbers, and underscores.');
        if (!form.fullName.trim()) return setError('Full name is required.');
        if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return setError('Valid email is required.');
        if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) return setError('Valid 10-digit phone number is required.');
        if (form.password.length < 8)
            return setError('Password must be at least 8 characters.');
        if (form.password !== form.confirmPassword)
            return setError('Passwords do not match.');

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: form.username.trim(),
                    password: form.password,
                    role: form.role,
                    fullName: form.fullName.trim(),
                    email: form.email.trim(),
                    phone: form.phone.trim()
                })
            });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed. Please try again.');
            }

            setSuccess('Account created! Redirecting to login...');
            setTimeout(() => window.location.href = '/login', 1800);
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: '480px' }}>
                {/* Logo */}
                <div className="auth-logo">
                    <div className="auth-logo-icon">⚖️</div>
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join India's AI-powered legal guidance platform</p>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}><span>⚠️</span> {error}</div>}
                {success && <div className="alert alert-success" style={{ marginBottom: '20px' }}><span>✅</span> {success}</div>}

                <form className="auth-form" onSubmit={handleSubmit} id="register-form">
                    {/* Username */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-username">Username</label>
                        <input
                            id="reg-username"
                            className="form-input"
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="Choose a unique username"
                            autoComplete="username"
                            autoFocus
                            spellCheck={false}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            Letters, numbers, underscores only. Min 3 characters.
                        </span>
                    </div>

                    {/* Full Name */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-fullname">Full Name</label>
                        <input
                            id="reg-fullname"
                            className="form-input"
                            type="text"
                            name="fullName"
                            value={form.fullName}
                            onChange={handleChange}
                            placeholder="Your legal name"
                            autoComplete="name"
                        />
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-email">Email Address</label>
                        <input
                            id="reg-email"
                            className="form-input"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            autoComplete="email"
                        />
                    </div>

                    {/* Phone */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-phone">Phone Number</label>
                        <input
                            id="reg-phone"
                            className="form-input"
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="10-digit mobile number"
                            autoComplete="tel"
                        />
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="reg-password"
                                className="form-input"
                                type={showPass ? 'text' : 'password'}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Min 8 characters"
                                autoComplete="new-password"
                                style={{ paddingRight: '48px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(p => !p)}
                                style={{
                                    position: 'absolute', right: '14px', top: '50%',
                                    transform: 'translateY(-50%)', background: 'none',
                                    border: 'none', cursor: 'pointer', fontSize: '1.1rem',
                                    color: 'var(--text-dim)', padding: '0',
                                }}
                            >
                                {showPass ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {/* Strength indicator */}
                        {form.password.length > 0 && (
                            <div className="password-strength">
                                <div className="strength-bar">
                                    <div
                                        className="strength-fill"
                                        style={{
                                            width: `${(strength.score / 4) * 100}%`,
                                            background: strength.color,
                                        }}
                                    />
                                </div>
                                <span className="strength-text" style={{ color: strength.color }}>
                                    Password strength: {strength.label}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
                        <input
                            id="confirm-password"
                            className="form-input"
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="Re-enter your password"
                            autoComplete="new-password"
                        />
                        {form.confirmPassword && form.password !== form.confirmPassword && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--error)' }}>
                                Passwords do not match
                            </span>
                        )}
                        {form.confirmPassword && form.password === form.confirmPassword && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                                ✓ Passwords match
                            </span>
                        )}
                    </div>

                    {/* Role Selector */}
                    <div className="form-group">
                        <label className="form-label">I am a</label>
                        <div className="role-selector">
                            {[
                                { value: 'USER', icon: '👤', name: 'Citizen', desc: 'Seeking legal guidance' },
                                { value: 'ADVOCATE', icon: '⚖️', name: 'Advocate', desc: 'Legal professional' },
                            ].map(r => (
                                <div
                                    key={r.value}
                                    className={`role-option ${form.role === r.value ? 'active' : ''}`}
                                    onClick={() => setForm(p => ({ ...p, role: r.value }))}
                                    role="radio"
                                    aria-checked={form.role === r.value}
                                    id={`role-${r.value.toLowerCase()}`}
                                >
                                    <div className="role-icon">{r.icon}</div>
                                    <div className="role-name">{r.name}</div>
                                    <div className="role-desc">{r.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        id="register-btn"
                        className="btn btn-primary w-full"
                        type="submit"
                        disabled={loading}
                        style={{ marginTop: '4px' }}
                    >
                        {loading ? <span className="spinner" /> : '✨'}
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login">Sign In</Link></p>
                </div>

                <div className="disclaimer-banner" style={{ marginTop: '20px' }}>
                    <span>⚠️</span>
                    <span>This AI guidance is for informational purposes only and does not replace professional legal advice.</span>
                </div>
            </div>
        </div>
    );
}
