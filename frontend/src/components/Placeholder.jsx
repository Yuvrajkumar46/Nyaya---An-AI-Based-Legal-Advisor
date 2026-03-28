export default function Placeholder({ title }) {
    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '16px',
            color: 'var(--text-secondary)'
        }}>
            <span style={{ fontSize: '3rem' }}>🚧</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{title}</h2>
            <p style={{ color: 'var(--text-dim)' }}>This module is coming soon.</p>
            <button className="btn btn-ghost" onClick={() => window.history.back()}>← Go Back</button>
        </div>
    );
}
