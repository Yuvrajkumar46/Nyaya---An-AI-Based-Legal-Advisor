import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function ShareDocumentModal({ documentId, onClose }) {
    const [advocates, setAdvocates] = useState([]);
    const [selectedAdvocate, setSelectedAdvocate] = useState('');
    const [accessLevel, setAccessLevel] = useState('view_download');
    const [expiryDays, setExpiryDays] = useState('7');
    const [loading, setLoading] = useState(false);
    const [shareUrl, setShareUrl] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch advocates the user has interacted with (appointments)
        const fetchAdvocates = async () => {
            try {
                // For simplicity assuming there's an endpoint to get past associated advocates based on user context
                // Fallback implemented if such endpoint isn't fully scaffolded: we query appt history
                const { data } = await api.get('/v1/appointments');

                // Deduplicate advocates they've spoken to
                const uniqueAdvs = [];
                const seenIds = new Set();

                const allAppts = [...(data.upcoming || []), ...(data.past || [])];
                for (const appt of allAppts) {
                    if (appt.Advocate && !seenIds.has(appt.Advocate.id)) {
                        seenIds.add(appt.Advocate.id);
                        uniqueAdvs.push(appt.Advocate);
                    }
                }
                setAdvocates(uniqueAdvs);
            } catch (err) {
                console.error("Share Modal Meta Err:", err);
            }
        };
        fetchAdvocates();
    }, []);

    const handleShare = async (e) => {
        e.preventDefault();
        setError('');

        if (!selectedAdvocate) {
            setError('Please select an Advocate.');
            return;
        }

        setLoading(true);
        try {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays));

            const { data } = await api.post(`/v1/documents/${documentId}/share`, {
                advocate_id: selectedAdvocate,
                access_level: accessLevel,
                expires_at: expiresAt.toISOString()
            });

            // Construct full shareable link natively dynamically via window domain
            setShareUrl(`${window.location.origin}${data.share_link}`);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#161f30] border border-gray-700 rounded-2xl p-8 max-w-lg w-full shadow-2xl relative">

                <h2 className="text-2xl font-bold text-white mb-2">Share Document Securely</h2>
                <p className="text-gray-400 mb-6 text-sm">Target explicitly allowed advocates. The dynamically generated URL expires securely mitigating unbounded data dumps.</p>

                {error && <div className="text-red-400 mb-4 bg-red-900/20 p-3 rounded">{error}</div>}

                {!shareUrl ? (
                    <form onSubmit={handleShare} className="space-y-5">

                        <div>
                            <label className="block text-gray-300 font-medium mb-1.5 text-sm">Select Target Advocate *</label>
                            {advocates.length === 0 ? (
                                <div className="bg-gray-800 border border-yellow-700 text-yellow-500 p-3 rounded text-sm">
                                    You have no booked advocates in your network. Please schedule an appointment first.
                                </div>
                            ) : (
                                <select
                                    value={selectedAdvocate}
                                    onChange={e => setSelectedAdvocate(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:border-cyan-500 outline-none"
                                >
                                    <option value="" disabled>-- Select an Advocate --</option>
                                    {advocates.map(adv => (
                                        <option key={adv.id} value={adv.id}>Adcovate {adv.user?.full_name || `#${adv.id}`} - {adv.specialization}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-300 font-medium mb-1.5 text-sm">Access Permissions</label>
                            <select
                                value={accessLevel}
                                onChange={e => setAccessLevel(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:border-cyan-500 outline-none"
                            >
                                <option value="view">View Only</option>
                                <option value="view_download">View & Download</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-gray-300 font-medium mb-1.5 text-sm">Link Expiry</label>
                            <select
                                value={expiryDays}
                                onChange={e => setExpiryDays(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:border-cyan-500 outline-none"
                            >
                                <option value="1">24 Hours</option>
                                <option value="3">3 Days</option>
                                <option value="7">7 Days</option>
                                <option value="14">14 Days</option>
                                <option value="30">30 Days Max</option>
                            </select>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 btn bg-gray-700 hover:bg-gray-600 text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || advocates.length === 0}
                                className={`flex-1 btn bg-blue-600 hover:bg-blue-500 text-white ${loading ? 'opacity-50' : ''}`}
                            >
                                {loading ? 'Generating...' : 'Generate Sec-Link'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="bg-gray-800 p-6 rounded-xl border border-blue-900/50 text-center">
                        <div className="text-5xl mb-4">✅</div>
                        <h3 className="text-xl font-bold text-white mb-2">Signed Link Generated</h3>
                        <p className="text-gray-400 text-sm mb-6">This URL contains your secure `share_token` cryptographic payload and expires in {expiryDays} days natively.</p>

                        <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg border border-gray-700 mb-4 h-12">
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                className="bg-transparent text-gray-300 text-sm flex-1 outline-none px-2"
                            />
                            <button onClick={copyToClipboard} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-sm font-medium">Copy</button>
                        </div>

                        <button onClick={onClose} className="w-full btn bg-gray-700 hover:bg-gray-600 text-white mt-4">Done</button>
                    </div>
                )}
            </div>
        </div>
    );
}
