import { useState } from 'react';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="app-layout">
            <AdminSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="main-wrapper">
                {/* Mobile Header */}
                <header className="mobile-header">
                    <div className="mobile-brand text-cyan">
                        <span style={{ fontSize: '1.4rem' }}>🛡️</span> Nyaya Admin
                    </div>
                    <button
                        className="btn-ghost"
                        onClick={() => setIsSidebarOpen(true)}
                        style={{ padding: '8px', fontSize: '1.2rem', color: 'var(--cyan-primary)' }}
                    >
                        ☰
                    </button>
                </header>

                <div className="main-content">
                    {children}
                </div>
            </main>
        </div>
    );
}
