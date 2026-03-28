import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function JoinCallPage() {
    const { appointment_id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [appointment, setAppointment] = useState(null);
    const [walletBalance, setWalletBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [hasPermissions, setHasPermissions] = useState(false);
    const [permError, setPermError] = useState('');
    const [consent, setConsent] = useState(false);
    const [joining, setJoining] = useState(false);

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Fetch appointment details
                const { data: apptData } = await api.get(`/v1/appointments/${appointment_id}`);
                setAppointment(apptData.appointment);

                // Fetch user data for wallet
                const { data: userData } = await api.get('/v1/users/me');
                setWalletBalance(userData.data.walletBalance);

            } catch (err) {
                console.error(err);
                setError('Could not load appointment details. It may be invalid.');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();

        // Check Hardware Permissions automatically on load
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                setHasPermissions(true);
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(() => {
                setHasPermissions(false);
                setPermError("Please allow camera and microphone access in your browser settings.");
            });

        return () => {
            // Cleanup stream when navigating away
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [appointment_id]);

    const handleJoin = async () => {
        setJoining(true);
        setError('');
        try {
            // Initiate Call dynamically
            const { data } = await api.post('/v1/calls/initiate', { appointment_id });

            // Navigate to active call room
            navigate(`/calls/active/${data.call_id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Server error initiating the call.');
            setJoining(false);
        }
    };

    if (loading) return <div className="spinner" style={{ margin: '4rem auto' }}></div>;

    if (error || !appointment) {
        return (
            <div className="module-page text-center py-20 px-8">
                <span className="text-4xl">⚠️</span>
                <h3 className="mt-4">{error}</h3>
                <button className="btn btn-outline mt-6" onClick={() => navigate('/appointments')}>Back to Appointments</button>
            </div>
        );
    }

    const hourlyRate = parseFloat(appointment.amount || 0) * (60 / Math.max(appointment.duration_minutes, 1));
    const isWalletSufficient = walletBalance >= hourlyRate;

    const canJoin = hasPermissions && consent && isWalletSufficient;

    return (
        <div className="module-page flex flex-col items-center justify-center p-8 bg-[#0d1117] min-h-screen text-white">
            <div className="max-w-2xl w-full bg-[#1e2a40] rounded-xl border border-gray-700 shadow-2xl overflow-hidden anim-fade-in">

                <div className="bg-[#121822] p-6 text-center border-b border-gray-700">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                        Ready to Join Call?
                    </h1>
                </div>

                <div className="p-8">
                    {/* Camera Preview */}
                    <div className="w-full bg-black rounded-lg aspect-video flex items-center justify-center mb-8 overflow-hidden relative border border-gray-800 shadow-inner">
                        {!hasPermissions ? (
                            <div className="text-center p-4">
                                <span className="text-4xl block mb-2 opacity-50">📷</span>
                                <p className="text-gray-400">Camera preview unavailable.</p>
                                <p className="text-red-400 text-sm mt-2">{permError}</p>
                            </div>
                        ) : (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            />
                        )}
                        <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded text-sm backdrop-blur-sm">
                            You
                        </div>
                    </div>

                    {/* Pre-Call Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-300 mb-8 bg-[#161f30] p-4 rounded-lg">
                        <div><span className="text-gray-500">With:</span> Adv. {appointment.advocate_name || 'Legal Expert'}</div>
                        <div><span className="text-gray-500">Type:</span> {appointment.appointment_type === 'video' ? 'Video Call' : 'Voice Call'}</div>
                        <div><span className="text-gray-500">Duration:</span> {appointment.duration_minutes} minutes</div>
                        <div><span className="text-gray-500">Rate:</span> <span className="text-cyan-400 font-bold">₹{hourlyRate.toLocaleString('en-IN')}/hour</span></div>
                    </div>

                    {/* Pre-call Checklist */}
                    <div className="space-y-4 mb-8">
                        <h3 className="text-gray-400 uppercase tracking-wider text-xs font-semibold mb-2">Pre-Call Checklist</h3>

                        <div className="flex items-center gap-3">
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm ${hasPermissions ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
                                {hasPermissions ? '✓' : '✕'}
                            </span>
                            <span className={hasPermissions ? 'text-gray-200' : 'text-red-400'}>
                                Camera and microphone permission granted
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm ${isWalletSufficient ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
                                {isWalletSufficient ? '✓' : '✕'}
                            </span>
                            <span className={isWalletSufficient ? 'text-gray-200' : 'text-red-400'}>
                                Wallet balance sufficient (Required: ₹{hourlyRate.toLocaleString('en-IN')}, Balance: ₹{Number(walletBalance || 0).toFixed(2)})
                            </span>
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer group mt-4">
                            <input
                                type="checkbox"
                                checked={consent}
                                onChange={(e) => setConsent(e.target.checked)}
                                className="mt-1 w-5 h-5 accent-cyan-500 rounded border-gray-600 bg-gray-800"
                            />
                            <span className="text-gray-300 group-hover:text-white transition-colors">
                                I consent to this call being processed securely according to the platform's DPDPA provisions and recorded for billing resolution purposes.
                            </span>
                        </label>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleJoin}
                        disabled={!canJoin || joining}
                        className={`w-full py-4 rounded-lg font-bold text-lg transition-all
                            ${canJoin
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] text-white'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                            }`
                        }
                    >
                        {joining ? 'Connecting securely...' : 'Join Call Now'}
                    </button>
                    {!canJoin && (
                        <p className="text-center text-sm text-red-400 mt-4 opacity-80">
                            Please complete all checklist items to join.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
