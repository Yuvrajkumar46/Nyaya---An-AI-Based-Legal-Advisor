import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';
import Peer from 'peerjs';

export default function ActiveCallPage() {
    const { call_id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Core States
    const [callData, setCallData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // WebRTC & Media
    const myVideoRef = useRef(null);
    const peerVideoRef = useRef(null);
    const [myStream, setMyStream] = useState(null);
    const [cameraOn, setCameraOn] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [speakerVolume, setSpeakerVolume] = useState(true);
    const [peerConnected, setPeerConnected] = useState(false);

    // Connections
    const socketRef = useRef(null);
    const peerRef = useRef(null);

    // Panels
    const [showChat, setShowChat] = useState(false);
    const [showDocs, setShowDocs] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [msgText, setMsgText] = useState('');

    // Timer & Billing
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [amountCharged, setAmountCharged] = useState(0);
    const [warning, setWarning] = useState('');
    const timerRef = useRef(null);
    const syncIntervalRef = useRef(null);
    const disconnectTimerRef = useRef(null);

    // Init Logic
    useEffect(() => {
        const initCall = async () => {
            try {
                // Fetch call summary (gives us rate, duration, etc.)
                const { data } = await api.get(`/v1/calls/${call_id}/summary`);
                const cd = data.call;
                cd.rate = parseFloat(data.billing.rate);
                cd.maxSeconds = parseInt(cd.duration_seconds) || 3600; // default 1h if not set
                cd.wallet = parseFloat(data.billing.wallet_balance);
                setCallData(cd);

                // Start physical media
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setMyStream(stream);
                if (myVideoRef.current) myVideoRef.current.srcObject = stream;

                // Setup Socket.io
                const socketUrl = process.env.VITE_API_URL || 'http://localhost:5000';
                socketRef.current = io(socketUrl.replace('/api', ''));

                socketRef.current.emit('join_room', call_id);

                // Real-time Chat
                socketRef.current.on('call:chat_message', (msg) => {
                    setChatMessages(prev => [...prev, msg]);
                });

                // End Call Event
                socketRef.current.on('call:ended', () => {
                    handleHardEndCall(false); // Remote ended
                });

                // Setup PeerJS
                const peer = new Peer(user.id.toString(), {
                    host: 'localhost',
                    port: 5000,
                    path: '/peerjs'
                });
                peerRef.current = peer;

                peer.on('open', (id) => {
                    // Ready to connect
                    console.log('Peer connected natively:', id);
                });

                peer.on('call', (incomingCall) => {
                    // Answer incoming WebRTC call
                    incomingCall.answer(stream);
                    incomingCall.on('stream', (remoteStream) => {
                        setPeerConnected(true);
                        if (peerVideoRef.current) peerVideoRef.current.srcObject = remoteStream;
                        startTimer(cd); // Start timer when both connected
                    });
                });

                // Attempt to call the other party (predictive approach based on roles)
                // Advocate calls user or User calls advocate. Assuming advocate_id and caller_id exist.
                // We'll trust PeerJS will connect when both are up.

            } catch (err) {
                console.error(err);
                setError('Failed to securely initialize media connections. Retrying may be needed.');
            } finally {
                setLoading(false);
            }
        };

        initCall();

        return () => {
            cleanupCall();
        };
        // eslint-disable-next-line
    }, [call_id]);

    const startTimer = (cd) => {
        if (timerRef.current) return;

        // Per-second calculation
        timerRef.current = setInterval(() => {
            setSecondsElapsed(prev => {
                const nextSec = prev + 1;

                // Calculate real-time billing
                const curAmount = (nextSec / 3600) * cd.rate;
                setAmountCharged(curAmount);

                // Warnings
                const timeRemaining = cd.maxSeconds - nextSec;
                if (timeRemaining === 300) setWarning('⚠️ 5 minutes remaining in your booking');
                else if (timeRemaining === 120) setWarning('🔴 2 minutes remaining');
                else if (timeRemaining <= 0) {
                    handleHardEndCall(true); // Auto end
                }

                // Wallet max cap check
                const maxAffordableSeconds = (cd.wallet / cd.rate) * 3600;
                const walletTimeRemaining = maxAffordableSeconds - nextSec;
                if (walletTimeRemaining <= 120 && walletTimeRemaining > 119) {
                    setWarning('🔴 Wallet low: 2 minutes remaining');
                } else if (walletTimeRemaining <= 0) {
                    handleHardEndCall(true);
                }

                return nextSec;
            });
        }, 1000);

        // 10 Second Sync Emit
        syncIntervalRef.current = setInterval(() => {
            if (socketRef.current) {
                socketRef.current.emit('call:billing_update', {
                    call_id,
                    amount_charged: amountCharged
                });
            }
        }, 10000);
    };

    const cleanupCall = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
        if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);

        if (myStream) myStream.getTracks().forEach(t => t.stop());
        if (peerRef.current) peerRef.current.destroy();
        if (socketRef.current) socketRef.current.disconnect();
    };

    const handleHardEndCall = async (isLocalAction = true) => {
        cleanupCall();

        if (isLocalAction) {
            try {
                // Call API to end physically
                socketRef.current?.emit('call:ended', { call_id });
                await api.post(`/v1/calls/${call_id}/end`);
            } catch (err) {
                console.error("End call API failed", err);
            }
        }

        navigate(`/calls/summary/${call_id}`, { replace: true });
    };

    const confirmEndCall = () => {
        if (window.confirm(`End call? You will be charged ₹${Number(amountCharged || 0).toFixed(2)} for ${Math.ceil(secondsElapsed / 60)} minutes.`)) {
            handleHardEndCall(true);
        }
    };

    const toggleMic = () => {
        if (myStream) {
            const audioTrack = myStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setMicOn(audioTrack.enabled);
            }
        }
    };

    const toggleCamera = () => {
        if (myStream) {
            const videoTrack = myStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setCameraOn(videoTrack.enabled);
            }
        }
    };

    const sendChat = () => {
        if (!msgText.trim()) return;
        const msg = {
            id: Date.now().toString(),
            call_id,
            sender_id: user.id,
            text: msgText,
            timestamp: new Date().toISOString()
        };
        socketRef.current.emit('call:chat_message', msg);
        setChatMessages(prev => [...prev, msg]);
        api.post(`/v1/calls/${call_id}/chat`, { message: msgText }); // Save to db
        setMsgText('');
    };

    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="spinner" style={{ margin: '4rem auto' }}></div>;
    if (error) return <div className="text-center p-20 text-red-500">{error}</div>;

    return (
        <div className="module-page flex flex-col h-screen bg-[#070b14] overflow-hidden text-white relative">

            {/* TOP BAR */}
            <div className="absolute top-0 left-0 w-full z-10 px-6 py-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold tracking-widest text-cyan-400">NYAYA ⚖️</h2>
                    <div className="bg-red-500/20 border border-red-500 text-red-500 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        LIVE {formatTime(secondsElapsed)}
                    </div>
                </div>

                {warning && (
                    <div className="bg-orange-500/20 border border-orange-500 text-orange-400 px-4 py-1 rounded shadow-[0_0_10px_rgba(249,115,22,0.4)] animate-pulse">
                        {warning}
                    </div>
                )}
            </div>

            {/* MAIN VIDEO AREA */}
            <div className="flex-1 relative w-full h-full">
                {/* Remote Video (Advocate) */}
                <video
                    ref={peerVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ opacity: peerConnected ? 1 : 0.2 }}
                />

                {!peerConnected && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <div className="spinner mb-4 w-12 h-12"></div>
                        <p>Waiting for the other party to join securely...</p>
                        <button className="mt-4 btn btn-outline" onClick={() => startTimer(callData)}>Force Start Timer (Dev Bypass)</button>
                    </div>
                )}

                {/* Local Video (You) - Minimal Corner */}
                <div className="absolute bottom-28 right-6 w-48 aspect-video bg-black rounded-xl border-2 border-gray-700 shadow-2xl overflow-hidden z-20 transition-all hover:scale-105">
                    <video
                        ref={myVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs">You</div>
                </div>

                {/* Info Overlay (Bottom Left) */}
                <div className="absolute bottom-28 left-6 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-gray-700 shadow-lg z-20">
                    <h3 className="font-bold text-lg">{callData.advocate_name || 'Legal Consultation'}</h3>
                    <p className="text-cyan-400 text-sm mt-1 border-t border-gray-700 pt-2 flex items-center justify-between gap-8">
                        <span>Rate: ₹{callData.rate}/hr</span>
                        <span>₹{Number(amountCharged || 0).toFixed(2)} charged</span>
                    </p>
                </div>
            </div>

            {/* BOTTOM CONTROLS BAR */}
            <div className="absolute bottom-0 left-0 w-full z-30 px-6 py-6 bg-gradient-to-t from-black via-black/90 to-transparent flex justify-center items-center gap-6">

                <button
                    onClick={toggleMic}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${micOn ? 'bg-gray-800 hover:bg-gray-700 border border-gray-600' : 'bg-red-500/20 text-red-500 border border-red-500'}`}
                >
                    {micOn ? '🎤' : '🔇'}
                </button>

                <button
                    onClick={toggleCamera}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${cameraOn ? 'bg-gray-800 hover:bg-gray-700 border border-gray-600' : 'bg-red-500/20 text-red-500 border border-red-500'}`}
                >
                    {cameraOn ? '📷' : '🚫'}
                </button>

                <button
                    onClick={() => { setShowChat(!showChat); setShowDocs(false); }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${showChat ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500' : 'bg-gray-800 hover:bg-gray-700 border border-gray-600'}`}
                >
                    💬
                </button>

                <button
                    onClick={() => { setShowDocs(!showDocs); setShowChat(false); }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${showDocs ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500' : 'bg-gray-800 hover:bg-gray-700 border border-gray-600'}`}
                >
                    📄
                </button>

                <button
                    onClick={() => setSpeakerVolume(!speakerVolume)}
                    className="w-14 h-14 rounded-full flex items-center justify-center text-xl bg-gray-800 hover:bg-gray-700 border border-gray-600 transition-all"
                >
                    {speakerVolume ? '🔊' : '🔈'}
                </button>

                <div className="w-px h-10 bg-gray-700 mx-2"></div>

                <button
                    onClick={confirmEndCall}
                    className="px-8 h-14 rounded-full flex items-center justify-center text-lg font-bold bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all"
                >
                    📞 End Call
                </button>

            </div>

            {/* SLIDE-IN CHAT PANEL */}
            <div className={`absolute top-0 right-0 h-full w-80 bg-[#161f30] border-l border-gray-700 shadow-2xl z-40 transition-transform duration-300 transform ${showChat ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#1e2a40]">
                    <h3 className="font-bold">In-Call Chat</h3>
                    <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.length === 0 ? (
                        <p className="text-center text-gray-500 mt-10">Send a message to the other party.</p>
                    ) : (
                        chatMessages.map(msg => (
                            <div key={msg.id} className={`flex flex-col ${msg.sender_id === user.id ? 'items-end' : 'items-start'}`}>
                                <span className="text-xs text-gray-400 mb-1">{msg.sender_id === user.id ? 'You' : 'Advocate'}</span>
                                <div className={`px-3 py-2 rounded-lg max-w-[85%] ${msg.sender_id === user.id ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 border-t border-gray-700 bg-[#1e2a40] flex gap-2">
                    <input
                        type="text"
                        value={msgText}
                        onChange={e => setMsgText(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && sendChat()}
                        placeholder="Type message..."
                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 outline-none focus:border-cyan-500 text-sm"
                    />
                    <button onClick={sendChat} className="bg-cyan-500 hover:bg-cyan-400 text-white px-3 py-2 rounded text-sm font-bold">
                        Send
                    </button>
                </div>
            </div>

            {/* SLIDE-IN DOCS PANEL */}
            <div className={`absolute top-0 right-0 h-full w-80 bg-[#161f30] border-l border-gray-700 shadow-2xl z-40 transition-transform duration-300 transform ${showDocs ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#1e2a40]">
                    <h3 className="font-bold">Shared Documents</h3>
                    <button onClick={() => setShowDocs(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <div className="flex-1 p-6 text-center text-gray-500 flex flex-col items-center justify-center">
                    <span className="text-5xl mb-4 opacity-30">📁</span>
                    <p>No documents shared yet.</p>
                    <button className="btn btn-outline mt-6 w-full text-sm">Upload & Share</button>
                </div>
            </div>

        </div>
    );
}
