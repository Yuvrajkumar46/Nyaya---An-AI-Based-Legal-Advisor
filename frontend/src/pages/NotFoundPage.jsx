import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
    return (
        <div style={{ color: 'white', padding: '24px', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0d1117' }}>
            <h1 style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--cyan-primary)' }}>404</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>The page you are looking for does not exist.</p>
            <Link to="/login" className="btn btn-outline" style={{ borderColor: 'var(--cyan-primary)', color: 'var(--cyan-primary)' }}>
                Go Home
            </Link>
        </div>
    )
}

export default NotFoundPage;
