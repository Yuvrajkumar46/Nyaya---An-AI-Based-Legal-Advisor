import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';

export default function AddMoneyPage() {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [user, setUser] = useState({});

    const presets = [500, 1000, 2000, 5000];

    useEffect(() => {
        const fetchBal = async () => {
            try {
                const { data: balData } = await api.get('/v1/billing/wallet-balance');
                setBalance(balData.balance);
                const { data: userData } = await api.get('/v1/users/me');
                setUser(userData.data);
            } catch (err) {
                console.error("Failed to load details");
            } finally {
                setLoading(false);
            }
        };
        fetchBal();
    }, []);

    const handleProceed = async () => {
        const value = parseInt(amount);
        if (!value || isNaN(value) || value < 100) {
            return alert('Please enter a valid amount (minimum ₹100).');
        }

        setProcessing(true);
        try {
            // Create Order
            const { data: orderData } = await api.post('/v1/billing/create-order', { amount: value });

            // Initialize Razorpay
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'Nyaya Legal',
                description: 'Add Money to Wallet',
                order_id: orderData.order_id,
                handler: async (response) => {
                    // Payment successful callback -> Verify on Backend
                    try {
                        const { data: verifyData } = await api.post('/v1/billing/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amount: value // Standard INR Amount
                        });

                        if (verifyData.success) {
                            alert(`Successfully added ₹${value} to wallet!`);
                            navigate('/billing');
                        }
                    } catch (err) {
                        alert(err.response?.data?.message || 'Payment Verification Failed. Contact Support.');
                        setProcessing(false);
                    }
                },
                prefill: {
                    name: user.fullName || user.username || 'User',
                    contact: user.phone || '9999999999',
                    email: user.email || 'user@example.com'
                },
                theme: { color: '#00d4ff' },
                modal: {
                    ondismiss: function() {
                        setProcessing(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            
            rzp.on('payment.failed', function (response){
                alert(`Payment failed: ${response.error.description}`);
                setProcessing(false);
            });

            rzp.open();

        } catch (err) {
            alert(err.response?.data?.message || 'Could not initiate payment.');
            setProcessing(false);
        }
    };

    if (loading) return <Layout><div className="flex justify-center items-center h-screen"><div className="spinner"></div></div></Layout>;

    return (
        <Layout>
            <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6">
                <div className="w-full max-w-md bg-[#161f30] border border-gray-700 rounded-3xl shadow-2xl overflow-hidden anim-fade-in">
                    
                    <div className="bg-[#121822] p-6 border-b border-gray-800 text-center">
                        <button onClick={() => navigate('/billing')} className="absolute left-6 text-gray-400 hover:text-white mt-1">← Back</button>
                        <h2 className="text-xl font-bold text-white">Add Money to Wallet</h2>
                    </div>

                    <div className="p-8">
                        {/* Current Balance */}
                        <div className="text-center mb-10">
                            <div className="text-sm text-gray-500 mb-1">Current Balance</div>
                            <div className="text-3xl font-bold text-cyan-400">₹ {Number(balance || 0).toFixed(2)}</div>
                        </div>

                        {/* Amount Input */}
                        <div className="mb-8">
                            <label className="block text-sm font-semibold text-gray-300 mb-4">Enter Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400 font-bold">₹</span>
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0"
                                    min="100"
                                    className="w-full bg-[#0d131f] border-2 border-gray-700 focus:border-cyan-500 rounded-xl py-4 pl-10 pr-4 text-2xl font-bold text-white outline-none transition-colors"
                                />
                            </div>
                            <div className="text-xs text-gray-500 mt-2 text-right">Minimum amount: ₹100</div>
                        </div>

                        {/* Quick Presets */}
                        <div className="mb-10">
                            <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-semibold">Quick Amounts</div>
                            <div className="grid grid-cols-4 gap-3">
                                {presets.map(preset => (
                                    <button
                                        key={preset}
                                        onClick={() => setAmount(preset.toString())}
                                        className={`py-2 rounded-lg border transition-all text-sm font-bold ${amount === preset.toString() ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-[#1e2a40] border-gray-700 text-gray-300 hover:border-gray-500'}`}
                                    >
                                        ₹{preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Payment Method Notice */}
                        <div className="bg-[#1e2a40] border border-gray-700 rounded-lg p-4 mb-8 flex items-start gap-4">
                            <div className="text-2xl">🔒</div>
                            <div>
                                <div className="text-sm font-bold text-white mb-1">Secure Payment</div>
                                <div className="text-xs text-gray-400 leading-relaxed">
                                    Proceed to securely pay via UPI, Credit/Debit Card, or Net Banking powered by Razorpay.
                                </div>
                            </div>
                        </div>

                        {/* Proceed Button */}
                        <button
                            onClick={handleProceed}
                            disabled={processing || !amount || Number(amount) < 100}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex justify-center items-center gap-2
                                ${(!amount || Number(amount) < 100 || processing) 
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' 
                                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white hover:shadow-[0_0_20px_rgba(0,212,255,0.4)]'
                                }`
                            }
                        >
                            {processing ? <div className="spinner border-none w-5 h-5 border-t-white"></div> : 'Proceed to Pay'}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
