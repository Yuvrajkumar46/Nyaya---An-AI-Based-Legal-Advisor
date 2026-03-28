import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';

export default function BillingPage() {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Stats
    const [stats, setStats] = useState({ total_spent: 0, total_refunds: 0 });

    // Filters
    const [typeFilter, setTypeFilter] = useState('All');
    const [sortFilter, setSortFilter] = useState('Newest');

    // Dispute Modal
    const [disputeTxn, setDisputeTxn] = useState(null);
    const [disputeForm, setDisputeForm] = useState({ reason: '', description: '' });
    const [disputeSubmitting, setDisputeSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [typeFilter, sortFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Wallet Balance
            const { data: balData } = await api.get('/v1/billing/wallet-balance');
            setBalance(balData.balance);

            // Transactions & Stats
            const { data: txData } = await api.get(`/v1/billing/transactions?type=${typeFilter}&sort=${sortFilter}`);
            setTransactions(txData.transactions);
            setStats({
                total_spent: txData.total_spent,
                total_refunds: txData.total_refunds
            });

        } catch (err) {
            setError('Could not fetch billing data');
        } finally {
            setLoading(false);
        }
    };

    const downloadInvoice = async (transaction_id) => {
        // Mock standard file download
        window.open(`${process.env.VITE_API_URL || 'http://localhost:5000/api'}/v1/billing/invoice/${transaction_id}?token=${localStorage.getItem('token')}`, '_blank');
    };

    const handleDisputeSubmit = async () => {
        if (!disputeForm.reason || disputeForm.description.length < 20) {
            return alert('Select a reason and provide at least 20 characters of description.');
        }

        setDisputeSubmitting(true);
        try {
            await api.post('/v1/billing/dispute', {
                transaction_id: disputeTxn.transaction_id,
                reason: disputeForm.reason,
                description: disputeForm.description
            });
            alert('Dispute raised successfully. Admin will review within 48 hours.');
            setDisputeTxn(null);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error raising dispute');
        } finally {
            setDisputeSubmitting(false);
        }
    };

    const statsConfig = [
        {
            label: 'Total Spent',
            value: stats.total_spent,
            color: '#ef4444',
            bg: 'rgba(239,68,68,0.1)',
            border: 'rgba(239,68,68,0.3)',
            icon: '📉'
        },
        {
            label: 'Total Refunds',
            value: stats.total_refunds,
            color: '#22c55e',
            bg: 'rgba(34,197,94,0.1)',
            border: 'rgba(34,197,94,0.3)',
            icon: '💚'
        },
        {
            label: 'This Month',
            value: 0,
            color: '#00d4ff',
            bg: 'rgba(0,212,255,0.1)',
            border: 'rgba(0,212,255,0.3)',
            icon: '📊'
        }
    ];

    return (
        <Layout>
            <div style={{
                backgroundColor: '#0d1117',
                minHeight: '100vh',
                padding: '32px',
                fontFamily: 'Inter, sans-serif'
            }}>
                {/* Page title */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '28px'
                }}>
                    <div>
                        <h1 style={{
                            color: 'white',
                            fontSize: '28px',
                            fontWeight: '700',
                            margin: '0 0 4px 0'
                        }}>
                            Wallet & Billing
                        </h1>
                        <p style={{ color: '#8b949e', margin: 0 }}>
                            Manage your wallet and view transaction history
                        </p>
                    </div>
                </div>

                {/* Big gradient hero card */}
                <div style={{
                    background: 'linear-gradient(135deg, #0d2d3d 0%, #1a1040 50%, #0d1117 100%)',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    borderRadius: '16px',
                    padding: '32px',
                    marginBottom: '24px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Glowing orb effect behind */}
                    <div style={{
                        position: 'absolute',
                        top: '-40px',
                        right: '-40px',
                        width: '200px',
                        height: '200px',
                        background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)',
                        borderRadius: '50%'
                    }} />

                    <p style={{ color: '#8b949e', fontSize: '14px', marginBottom: '8px' }}>
                        💰 Available Balance
                    </p>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <h1 style={{
                            fontSize: '48px',
                            fontWeight: '800',
                            color: '#00d4ff',
                            margin: 0
                        }}>
                            ₹ {Number(balance || 0).toFixed(2)}
                        </h1>
                        <button
                            onClick={() => navigate('/billing/add-money')}
                            style={{
                                background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '14px 28px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                zIndex: 1
                            }}
                        >
                            + Add Money
                        </button>
                    </div>
                </div>

                {/* 3 Stats Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px'
                }}>
                    {statsConfig.map((stat, idx) => (
                        <div key={idx} style={{
                            background: stat.bg,
                            border: `1px solid ${stat.border}`,
                            borderRadius: '12px',
                            padding: '24px',
                        }}>
                            <p style={{ color: '#8b949e', fontSize: '13px', marginBottom: '8px' }}>
                                {stat.icon} {stat.label}
                            </p>
                            <h2 style={{
                                color: stat.color,
                                fontSize: '28px',
                                fontWeight: '700',
                                margin: 0
                            }}>
                                ₹ {Number(stat.value || 0).toFixed(2)}
                            </h2>
                        </div>
                    ))}
                </div>

                {/* Transactions Section */}
                <div style={{
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '16px',
                    overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '20px 24px',
                        borderBottom: '1px solid #30363d',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <h3 style={{ color: 'white', margin: 0, fontSize: '18px' }}>
                            Recent Transactions
                        </h3>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{
                                background: '#0d1117',
                                border: '1px solid #30363d',
                                color: 'white',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontSize: '14px'
                            }}>
                                <option value="All">All Types</option>
                                <option value="Credits">Credits</option>
                                <option value="Debits">Debits</option>
                                <option value="Refunds">Refunds</option>
                            </select>
                            <select value={sortFilter} onChange={e => setSortFilter(e.target.value)} style={{
                                background: '#0d1117',
                                border: '1px solid #30363d',
                                color: 'white',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontSize: '14px'
                            }}>
                                <option value="Newest">Newest First</option>
                                <option value="Oldest">Oldest First</option>
                            </select>
                        </div>
                    </div>

                    {/* Empty state */}
                    {(!loading && transactions.length === 0) && (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 24px'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
                            <h3 style={{ color: 'white', marginBottom: '8px' }}>
                                No transactions yet
                            </h3>
                            <p style={{ color: '#8b949e', marginBottom: '24px' }}>
                                Add money to your wallet to get started
                            </p>
                            <button
                                onClick={() => navigate('/billing/add-money')}
                                style={{
                                    background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '12px 24px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                + Add Money to Wallet
                            </button>
                        </div>
                    )}

                    {/* Loading state */}
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#8b949e' }}>
                            Loading transactions...
                        </div>
                    )}

                    {/* Transaction rows when they exist */}
                    {!loading && transactions.length > 0 && transactions.map(txn => {
                        const canDispute = txn.transaction_type === 'debit' && txn.status === 'completed' &&
                            ((Date.now() - new Date(txn.created_at).getTime()) / (1000 * 3600 * 24) <= 7);

                        return (
                            <div key={txn.transaction_id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px 24px',
                                borderBottom: '1px solid #21262d',
                                transition: 'background 0.2s',
                                flexWrap: 'wrap',
                                gap: '12px'
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = '#1c2128'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '250px' }}>
                                    {/* Icon */}
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        background: txn.transaction_type === 'credit'
                                            ? 'rgba(34,197,94,0.15)'
                                            : 'rgba(239,68,68,0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                        marginRight: '16px',
                                        flexShrink: 0
                                    }}>
                                        {txn.transaction_type === 'credit' ? '↑' : '↓'}
                                    </div>

                                    {/* Details */}
                                    <div>
                                        <p style={{
                                            color: 'white',
                                            fontWeight: '600',
                                            margin: '0 0 4px 0'
                                        }}>
                                            {txn.description}
                                            {txn.status === 'disputed' && (
                                                <span style={{
                                                    background: 'rgba(249, 115, 22, 0.2)',
                                                    color: '#fb923c',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    marginLeft: '8px',
                                                    border: '1px solid rgba(249, 115, 22, 0.3)'
                                                }}>Disputed</span>
                                            )}
                                        </p>
                                        <p style={{ color: '#8b949e', fontSize: '13px', margin: 0 }}>
                                            {new Date(txn.created_at).toLocaleDateString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                            <span style={{ opacity: 0.7, marginLeft: '8px', borderLeft: '1px solid #30363d', paddingLeft: '8px' }}>
                                                Ref: {txn.transaction_id.split('-')[0].toUpperCase()}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                    <p style={{
                                        color: txn.description.includes('Refund') ? '#fbbf24' : txn.transaction_type === 'credit' ? '#22c55e' : '#ef4444',
                                        fontWeight: '700',
                                        fontSize: '18px',
                                        margin: 0
                                    }}>
                                        {txn.transaction_type === 'credit' ? '+' : '-'}
                                        ₹ {Number(txn.amount).toFixed(2)}
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {txn.transaction_type === 'debit' && (
                                            <button onClick={() => downloadInvoice(txn.transaction_id)} style={{
                                                background: 'transparent',
                                                border: '1px solid #30363d',
                                                color: '#8b949e',
                                                borderRadius: '6px',
                                                padding: '4px 10px',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}>
                                                Invoice
                                            </button>
                                        )}
                                        {canDispute && (
                                            <button onClick={() => setDisputeTxn(txn)} style={{
                                                background: 'rgba(239,68,68,0.1)',
                                                border: '1px solid rgba(239,68,68,0.2)',
                                                color: '#ef4444',
                                                borderRadius: '6px',
                                                padding: '4px 10px',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}>
                                                Dispute
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>

            {/* DISPUTE MODAL */}
            {disputeTxn && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
                    <div className="bg-[#161f30] border border-gray-700 rounded-2xl w-full max-w-lg p-8 shadow-2xl relative">
                        <button onClick={() => setDisputeTxn(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl border-none bg-transparent cursor-pointer">✕</button>

                        <h2 className="text-2xl font-bold text-white mb-2" style={{ marginTop: 0 }}>Dispute Charge</h2>
                        <p className="text-gray-400 text-sm mb-6">Ref: {disputeTxn.transaction_id}</p>

                        <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label className="block text-gray-300 text-sm mb-2 font-semibold">Reason for dispute</label>
                                <select
                                    value={disputeForm.reason}
                                    onChange={e => setDisputeForm({ ...disputeForm, reason: e.target.value })}
                                    className="w-full bg-[#0d131f] border border-gray-600 rounded-lg p-3 text-white outline-none focus:border-cyan-500"
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                >
                                    <option value="">Select a reason...</option>
                                    <option value="Call disconnected early">Call disconnected early</option>
                                    <option value="Did not receive service">Did not receive service</option>
                                    <option value="Charged wrong amount">Charged wrong amount</option>
                                    <option value="Duplicate charge">Duplicate charge</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm mb-2 font-semibold">Provide Details (Min 20 chars)</label>
                                <textarea
                                    value={disputeForm.description}
                                    onChange={e => setDisputeForm({ ...disputeForm, description: e.target.value })}
                                    className="w-full bg-[#0d131f] border border-gray-600 rounded-lg p-3 text-white h-32 resize-none outline-none focus:border-cyan-500"
                                    placeholder="Please describe exactly what went wrong..."
                                    style={{ width: '100%', boxSizing: 'border-box', minHeight: '120px' }}
                                />
                                <div className="text-xs text-gray-500 text-right mt-1" style={{ textAlign: 'right', fontSize: '12px' }}>{disputeForm.description.length}/20 chars minimum</div>
                            </div>

                            <button
                                onClick={handleDisputeSubmit}
                                disabled={disputeSubmitting || !disputeForm.reason || disputeForm.description.length < 20}
                                className={`w-full py-4 rounded-lg font-bold text-white mt-4 border-none transition-all ${(!disputeForm.reason || disputeForm.description.length < 20) ? 'bg-gray-700 cursor-not-allowed text-gray-400' : 'bg-gradient-to-r from-red-500 to-orange-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}
                                style={{ width: '100%', padding: '16px', borderRadius: '8px', cursor: (!disputeForm.reason || disputeForm.description.length < 20) ? 'not-allowed' : 'pointer', background: (!disputeForm.reason || disputeForm.description.length < 20) ? '#374151' : 'linear-gradient(135deg, #ef4444, #f97316)', color: (!disputeForm.reason || disputeForm.description.length < 20) ? '#9ca3af' : 'white' }}
                            >
                                {disputeSubmitting ? 'Submitting...' : 'Submit Dispute'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </Layout>
    );
}
