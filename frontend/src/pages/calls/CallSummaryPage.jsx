import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function CallSummaryPage() {
    const { call_id } = useParams();
    const navigate = useNavigate();

    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Rating State
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);

    useEffect(() => {
        api.get(`/v1/calls/${call_id}/summary`)
            .then(({ data }) => setSummary(data))
            .catch(() => setError('Could not load call summary.'))
            .finally(() => setLoading(false));
    }, [call_id]);

    const handleRateSubmit = async () => {
        if (!rating) return alert('Please select a star rating.');
        setRatingSubmitting(true);
        try {
            await api.post(`/v1/calls/${call_id}/rate`, {
                rating,
                review_text: reviewText
            });
            setRatingSubmitted(true);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setRatingSubmitting(false);
        }
    };

    const downloadInvoice = () => {
        alert("Downloading PDF Invoice... (Mock Feature for now)");
    };

    if (loading) return <div className="spinner" style={{ margin: '4rem auto' }}></div>;
    if (error || !summary) return <div className="text-center p-20 text-red-500">{error}</div>;

    const { call, billing } = summary;

    return (
        <div className="module-page min-h-screen bg-[#0d1117] flex justify-center py-12 px-4 text-white font-inter">
            <div className="max-w-xl w-full">

                {/* SUCCESS HEADER */}
                <div className="text-center mb-8 anim-fade-in">
                    <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                        ✅
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-cyan-500">
                        Call Completed
                    </h1>
                    <p className="text-gray-400 mt-2">Your consultation has successfully ended.</p>
                </div>

                {/* SUMMARY CARD */}
                <div className="bg-[#161f30] border border-gray-700 rounded-xl p-8 shadow-2xl mb-8 anim-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="space-y-3 text-gray-300 mb-6">
                        <div className="flex justify-between">
                            <span className="text-gray-500">With:</span>
                            <span className="font-bold text-white">Adv. {call.advocate_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Date:</span>
                            <span>{new Date(call.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Duration:</span>
                            <span>{Math.floor(call.duration_seconds / 60)} mins {call.duration_seconds % 60} secs</span>
                        </div>
                    </div>

                    <hr className="border-gray-700 my-6" />

                    <div className="space-y-3 text-gray-300 mb-6">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Rate:</span>
                            <span>₹{parseFloat(billing.rate).toLocaleString('en-IN')}/hour</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Billable Duration:</span>
                            <span>{billing.duration_minutes} mins</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal Amount:</span>
                            <span>₹{parseFloat(billing.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">GST (18%):</span>
                            <span>₹{parseFloat(billing.gst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-lg flex justify-between items-center mt-2">
                        <span className="text-lg font-bold text-gray-200">Total Charged</span>
                        <span className="text-2xl font-bold text-cyan-400">₹{parseFloat(billing.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="text-center mt-4 text-sm text-gray-500">
                        Remaining Wallet Balance: <strong className="text-gray-300">₹{parseFloat(billing.wallet_balance).toLocaleString('en-IN')}</strong>
                    </div>
                </div>

                {/* RATING SECTION */}
                <div className="bg-[#1e2a40] border border-gray-700 rounded-xl p-8 shadow-xl text-center mb-8 anim-fade-in" style={{ animationDelay: '0.2s' }}>
                    {ratingSubmitted ? (
                        <div className="text-green-400 font-bold p-6">
                            ⭐ Thank you for your feedback!
                        </div>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold mb-4">Rate this Advocate</h3>
                            <div className="flex justify-center gap-2 mb-4 text-3xl">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        className="transition-transform hover:scale-125 focus:outline-none"
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        style={{ color: star <= (hoverRating || rating) ? '#fbbf24' : '#4b5563' }}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={reviewText}
                                onChange={e => setReviewText(e.target.value)}
                                placeholder="Describe your experience confidentially... (Optional)"
                                className="w-full bg-[#161f30] border border-gray-600 rounded-lg p-3 text-sm text-white resize-none h-24 focus:border-cyan-500 outline-none mb-4"
                            />
                            <button
                                onClick={handleRateSubmit}
                                disabled={ratingSubmitting || !rating}
                                className={`w-full py-3 rounded font-bold transition-all ${rating ? 'bg-cyan-500 hover:bg-cyan-400 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                            >
                                {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
                            </button>
                        </>
                    )}
                </div>

                {/* ACTIONS */}
                <div className="grid grid-cols-2 gap-4 anim-fade-in" style={{ animationDelay: '0.3s' }}>
                    <button className="btn bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 rounded-lg py-3 flex items-center justify-center gap-2" onClick={downloadInvoice}>
                        📄 Download Invoice
                    </button>
                    <button className="btn bg-gray-800 hover:bg-gray-700 text-cyan-400 border border-gray-600 rounded-lg py-3" onClick={() => navigate('/find-advocates')}>
                        Book Again
                    </button>
                    <button className="col-span-2 btn btn-primary py-4 rounded-lg mt-2 font-bold shadow-lg" onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </button>
                </div>

            </div>
        </div>
    );
}
