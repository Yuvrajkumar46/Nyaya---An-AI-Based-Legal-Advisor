import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function BookAppointmentPage() {
    const { id } = useParams(); // Advocate ID
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [advocate, setAdvocate] = useState(null);
    const [loading, setLoading] = useState(true);

    // Booking Form State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [fetchingSlots, setFetchingSlots] = useState(false);

    const [form, setForm] = useState({
        timeSlot: '',
        callType: 'video',
        duration: 30, // 30 or 60
        practiceArea: '',
        notes: ''
    });

    const [error, setError] = useState('');
    const [booking, setBooking] = useState(false);

    // Rate Mock
    const RATE_PER_HOUR = 2500;
    const amount = (form.duration / 60) * RATE_PER_HOUR;
    const gst = amount * 0.18;
    const totalAmount = amount + gst;

    useEffect(() => {
        // Fetch advocate details (mocked for now, assumes existing endpoint /v1/professionals/:id)
        api.get(`/v1/professionals/${id}`)
            .then(({ data }) => setAdvocate(data.advocate))
            .catch(() => setError('Error loading advocate details.'))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!selectedDate) return;
        setFetchingSlots(true);
        // Fetch availability from the new public availability endpoint
        api.get(`/v1/appointments/available-slots?advocate_id=${id}&date=${selectedDate}`)
            .then(({ data }) => setAvailableSlots(data.available_slots || []))
            .catch(() => setError('Could not load time slots.'))
            .finally(() => setFetchingSlots(false));
    }, [id, selectedDate]);

    const handleNext = () => {
        if (step === 1 && !form.timeSlot) return setError('Please select a time slot.');
        if (step === 2 && !form.practiceArea) return setError('Please specify a practice area.');
        setError('');
        setStep(s => s + 1);
    };

    const handleConfirm = async () => {
        setBooking(true);
        setError('');
        try {
            const payload = {
                advocate_id: id,
                date: selectedDate,
                time_slot: form.timeSlot,
                call_type: form.callType,
                duration_minutes: form.duration,
                practice_area: form.practiceArea,
                notes: form.notes
            };
            const { data } = await api.post('/v1/appointments/book', payload);
            alert(`Appointment Confirmed! Confirmation number: ${data.confirmation_number}`);
            navigate('/appointments');
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed.');
        } finally {
            setBooking(false);
        }
    };

    if (loading) return <div className="spinner" style={{ margin: '4rem auto' }}></div>;

    return (
        <div className="module-page" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginBottom: '1rem' }}>
                    ← Back to Profile
                </button>
                <h1 style={{ fontSize: '2rem', color: 'var(--text-bright)' }}>Book Consultation</h1>
                {advocate && <p style={{ color: 'var(--text-dim)' }}>with Adv. {advocate.full_name}</p>}
            </div>

            {/* Stepper */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                {[1, 2, 3].map(s => (
                    <div key={s} style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        background: s <= step ? 'var(--primary)' : 'var(--bg-tertiary)',
                        transition: 'background 0.3s'
                    }} />
                ))}
            </div>

            {error && <div className="error-message" style={{ marginBottom: '1.5rem' }}>{error}</div>}

            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px' }}>

                {/* STEP 1: DATE & TIME */}
                {step === 1 && (
                    <div className="anim-fade-in">
                        <h2 style={{ fontSize: '1.3rem', color: 'var(--text-bright)', marginBottom: '1.5rem' }}>Step 1: Date & Time</h2>

                        <div className="form-group">
                            <label className="form-label">Select Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={selectedDate}
                                onChange={e => { setSelectedDate(e.target.value); setForm({ ...form, timeSlot: '' }); }}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div className="form-group" style={{ marginTop: '1.5rem' }}>
                            <label className="form-label">Available Time Slots</label>
                            {fetchingSlots ? (
                                <div style={{ color: 'var(--text-dim)' }}>Loading slots...</div>
                            ) : availableSlots.length === 0 ? (
                                <div style={{ color: 'var(--text-dim)' }}>No slots available for this date.</div>
                            ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                                    {availableSlots.map(slot => (
                                        <button
                                            key={slot.time}
                                            disabled={!slot.available}
                                            onClick={() => setForm({ ...form, timeSlot: slot.time })}
                                            style={{
                                                padding: '0.6rem 1rem',
                                                borderRadius: '8px',
                                                border: form.timeSlot === slot.time ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                background: form.timeSlot === slot.time ? 'rgba(0, 212, 255, 0.1)' : slot.available ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                                                color: slot.available ? 'var(--text-bright)' : 'var(--text-dim)',
                                                cursor: slot.available ? 'pointer' : 'not-allowed',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {slot.time.slice(0, 5)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                            <button className="btn btn-primary" onClick={handleNext}>Continue</button>
                        </div>
                    </div>
                )}

                {/* STEP 2: DETAILS */}
                {step === 2 && (
                    <div className="anim-fade-in">
                        <h2 style={{ fontSize: '1.3rem', color: 'var(--text-bright)', marginBottom: '1.5rem' }}>Step 2: Consultation Details</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Call Type</label>
                                <select className="form-input" value={form.callType} onChange={e => setForm({ ...form, callType: e.target.value })}>
                                    <option value="video">Video Call</option>
                                    <option value="voice">Voice Call</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Duration</label>
                                <select className="form-input" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) })}>
                                    <option value={30}>30 Minutes</option>
                                    <option value={60}>60 Minutes (1 Hour)</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Practice Area</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Corporate Law, Property Dispute"
                                value={form.practiceArea}
                                onChange={e => setForm({ ...form, practiceArea: e.target.value })}
                            />
                        </div>

                        <div className="form-group" style={{ marginTop: '1.5rem' }}>
                            <label className="form-label">Briefly describe your issue (Optional)</label>
                            <textarea
                                className="form-input"
                                rows="4"
                                placeholder="Any context the advocate should know beforehand..."
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                            <button className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
                            <button className="btn btn-primary" onClick={handleNext}>Review & Pay</button>
                        </div>
                    </div>
                )}

                {/* STEP 3: REVIEW & PAYMENT */}
                {step === 3 && (
                    <div className="anim-fade-in">
                        <h2 style={{ fontSize: '1.3rem', color: 'var(--text-bright)', marginBottom: '1.5rem' }}>Step 3: Review & Schedule</h2>

                        <div style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '1rem' }}>Summary</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.8rem', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                <span style={{ color: 'var(--text-dim)' }}>Date:</span> <span>{new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'long', day: 'numeric' })}</span>
                                <span style={{ color: 'var(--text-dim)' }}>Time:</span> <span>{form.timeSlot.slice(0, 5)}</span>
                                <span style={{ color: 'var(--text-dim)' }}>Type:</span> <span>{form.callType === 'video' ? 'Video Call' : 'Voice Call'}</span>
                                <span style={{ color: 'var(--text-dim)' }}>Duration:</span> <span>{form.duration} Minutes</span>
                                <span style={{ color: 'var(--text-dim)' }}>Topic:</span> <span>{form.practiceArea}</span>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />

                            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '1rem' }}>Payment</h3>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                                <span>Consultation Fee</span>
                                <span>₹{Number(amount || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                                <span>GST (18%)</span>
                                <span>₹{Number(gst || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-bright)' }}>
                                <span>Total Payable</span>
                                <span>₹{Number(totalAmount || 0).toFixed(2)}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                            <button className="btn btn-outline" onClick={() => setStep(2)}>Back</button>
                            <button className="btn btn-primary" onClick={handleConfirm} disabled={booking}>
                                {booking ? 'Processing...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
