import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user } = useAuth();

    return (
        <div className="app-layout">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="main-wrapper">
                {/* Mobile Header */}
                <header className="mobile-header">
                    <div className="mobile-brand">
                        <span>⚖️</span> Nyaya
                    </div>
                    <button
                        className="btn btn-ghost hamburger-btn"
                        onClick={() => setIsSidebarOpen(true)}
                        aria-label="Open Menu"
                    >
                        ☰
                    </button>
                </header>

                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
