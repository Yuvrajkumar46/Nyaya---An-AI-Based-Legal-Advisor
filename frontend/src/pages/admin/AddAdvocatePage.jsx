import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';

const PRACTICE_AREAS = [
    'Criminal Law', 'Civil Law', 'Corporate Law', 'Family Law',
    'Labour Law', 'Tax Law', 'Intellectual Property', 'Real Estate'
];

const STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi'
];

export default function AddAdvocatePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        // Auth / Basic User
        username: '',
        email: '',
        password: '',
        full_name: '',
        // Professional
        phone: '',
        city: '',
        state: STATES[0],
        languages: '',
        bio: '',
        practice_areas: [],
        experience_years: '',
        education: '',
        firm_name: '',
        // Bar Council
        bci_registration_number: '',
        bar_council_state: STATES[0],
        // Consult
        hourly_rate: '',
        verification_status: 'pending'
    });

    const handleMultiSelect = (e, field) => {
        const val = e.target.value;
        const current = formData[field];
        if (current.includes(val)) {
            setFormData({ ...formData, [field]: current.filter(item => item !== val) });
        } else {
            setFormData({ ...formData, [field]: [...current, val] });
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e, verifyImmediately = false) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = { ...formData };
            if (verifyImmediately) payload.verification_status = 'verified';
            // convert languages string to array for simple handling
            payload.languages = payload.languages.split(',').map(s => s.trim()).filter(Boolean);

            const res = await api.post('/v1/admin/advocates', payload);
            if (res.data.success) {
                navigate('/admin/advocates');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add advocate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="dashboard-content max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Add New Advocate</h2>
                    <button className="btn btn-ghost" onClick={() => navigate('/admin/advocates')}>Cancel</button>
                </div>

                {error && <div className="alert alert-error mb-6">{error}</div>}

                <form className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* SYSTEM AUTH */}
                    <section>
                        <h3 className="text-lg font-bold text-cyan mb-4 border-b pb-2" style={{ borderColor: 'var(--border)' }}>System Authentication</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Username*</label>
                                <input type="text" name="username" className="form-input" required value={formData.username} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email*</label>
                                <input type="email" name="email" className="form-input" required value={formData.email} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Temporary Password*</label>
                                <input type="text" name="password" className="form-input" required value={formData.password} onChange={handleChange} />
                            </div>
                        </div>
                    </section>

                    {/* SECTION 1 - PERSONAL */}
                    <section>
                        <h3 className="text-lg font-bold text-cyan mb-4 border-b pb-2" style={{ borderColor: 'var(--border)' }}>1. Personal Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Full Name*</label>
                                <input type="text" name="full_name" className="form-input" required value={formData.full_name} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone*</label>
                                <input type="tel" name="phone" className="form-input" required value={formData.phone} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">City*</label>
                                <input type="text" name="city" className="form-input" required value={formData.city} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">State*</label>
                                <select name="state" className="form-input" required value={formData.state} onChange={handleChange}>
                                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="form-group md:col-span-2">
                                <label className="form-label">Languages (comma separated)*</label>
                                <input type="text" name="languages" className="form-input" placeholder="e.g. English, Hindi" required value={formData.languages} onChange={handleChange} />
                            </div>
                            <div className="form-group md:col-span-2">
                                <label className="form-label">Bio*</label>
                                <textarea name="bio" className="form-input" rows="3" maxLength={1000} required value={formData.bio} onChange={handleChange}></textarea>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2 - PROFESSIONAL */}
                    <section>
                        <h3 className="text-lg font-bold text-cyan mb-4 border-b pb-2" style={{ borderColor: 'var(--border)' }}>2. Professional Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group md:col-span-2">
                                <label className="form-label">Practice Areas*</label>
                                <div className="flex flex-wrap gap-2">
                                    {PRACTICE_AREAS.map(area => (
                                        <label key={area} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '6px' }}>
                                            <input
                                                type="checkbox"
                                                value={area}
                                                checked={formData.practice_areas.includes(area)}
                                                onChange={(e) => handleMultiSelect(e, 'practice_areas')}
                                            />
                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{area}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Years of Experience*</label>
                                <input type="number" name="experience_years" className="form-input" required min="0" value={formData.experience_years} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Education*</label>
                                <input type="text" name="education" className="form-input" placeholder="e.g. LLB, LLM" required value={formData.education} onChange={handleChange} />
                            </div>
                            <div className="form-group md:col-span-2">
                                <label className="form-label">Current Firm (Optional)</label>
                                <input type="text" name="firm_name" className="form-input" value={formData.firm_name} onChange={handleChange} />
                            </div>
                        </div>
                    </section>

                    {/* SECTION 3 - BAR COUNCIL */}
                    <section>
                        <h3 className="text-lg font-bold text-cyan mb-4 border-b pb-2" style={{ borderColor: 'var(--border)' }}>3. Bar Council Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">BCI Registration Number*</label>
                                <input type="text" name="bci_registration_number" className="form-input" placeholder="BCI-XX-XXXXX" required value={formData.bci_registration_number} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Bar Council State*</label>
                                <select name="bar_council_state" className="form-input" required value={formData.bar_council_state} onChange={handleChange}>
                                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 4 - CONSULT */}
                    <section>
                        <h3 className="text-lg font-bold text-cyan mb-4 border-b pb-2" style={{ borderColor: 'var(--border)' }}>4. Consultation Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Hourly Rate ₹*</label>
                                <input type="number" name="hourly_rate" className="form-input" required min="500" value={formData.hourly_rate} onChange={handleChange} />
                            </div>
                        </div>
                    </section>

                    {/* SECTION 5 - UPLOADS */}
                    <section>
                        <h3 className="text-lg font-bold text-cyan mb-4 border-b pb-2" style={{ borderColor: 'var(--border)' }}>5. Upload Documents (UI Mockup)</h3>
                        <p className="text-dim mb-4" style={{ fontSize: '0.9rem' }}>File uploads are bypassed for this demo. Documents will be marked as submitted.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button type="button" className="btn btn-secondary w-full">Upload BCI Certificate</button>
                            <button type="button" className="btn btn-secondary w-full">Upload Law Degree</button>
                            <button type="button" className="btn btn-secondary w-full">Upload Gov ID</button>
                        </div>
                    </section>

                    {/* BUTTONS */}
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                        <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/advocates')}>Cancel</button>
                        <button type="button" className="btn btn-secondary" onClick={(e) => handleSubmit(e, false)} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button type="button" className="btn btn-primary" onClick={(e) => handleSubmit(e, true)} disabled={loading} style={{ background: 'linear-gradient(135deg, #00d4ff, #0088aa)' }}>
                            {loading ? 'Saving...' : 'Save & Verify ✅'}
                        </button>
                    </div>

                </form>
            </div>
        </AdminLayout>
    );
}
