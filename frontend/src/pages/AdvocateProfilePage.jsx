import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function AdvocateProfilePage() {
    const { advocate_id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('about');

    // API Data States
    const [profile, setProfile] = useState(null);
    const [credentials, setCredentials] = useState([]);
    const [stats, setStats] = useState(null);
    const [reviewsData, setReviewsData] = useState(null);
    const [availabilityData, setAvailabilityData] = useState(null);

    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingTabs, setLoadingTabs] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInitialProfile = async () => {
            try {
                const res = await api.get(`/v1/professionals/${advocate_id}`);
                if (res.data.success) {
                    setProfile(res.data.advocate);
                    setCredentials(res.data.credentials);
                    setStats(res.data.stats);
                }
            } catch (err) {
                console.error(err);
                setError('Advocate profile not found.');
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchInitialProfile();
    }, [advocate_id]);

    // Fetch tab specific data lazily
    useEffect(() => {
        const fetchTabData = async () => {
            if (activeTab === 'reviews' && !reviewsData) {
                setLoadingTabs(true);
                try {
                    const res = await api.get(`/v1/professionals/${advocate_id}/reviews?limit=5`);
                    if (res.data.success) setReviewsData(res.data);
                } catch (e) { console.error('Error fetching reviews'); }
                finally { setLoadingTabs(false); }
            }
            if (activeTab === 'availability' && !availabilityData) {
                setLoadingTabs(true);
                try {
                    const res = await api.get(`/v1/professionals/${advocate_id}/availability`);
                    if (res.data.success) setAvailabilityData(res.data.available_slots);
                } catch (e) { console.error('Error fetching availability'); }
                finally { setLoadingTabs(false); }
            }
        };
        fetchTabData();
    }, [activeTab, advocate_id, reviewsData, availabilityData]);

    const handleBookConsultation = () => {
        if (!user) {
            navigate(`/login?redirect=/find-advocates`);
        } else {
            navigate(`/advocates/${advocate_id}/book`);
        }
    };

    if (loadingProfile) {
        return (
            <Layout>
                <div className="profile-loading">
                    <div className="spinner"></div>
                    <p>Loading Profile...</p>
                </div>
            </Layout>
        );
    }

    if (error || !profile) {
        return (
            <Layout>
                <div className="empty-state text-center py-20">
                    <span className="text-4xl block mb-4">⚠️</span>
                    <h3>{error}</h3>
                    <button className="btn btn-primary mt-4" onClick={() => navigate('/find-advocates')}>Back to Search</button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="profile-page-container">
                <button className="btn btn-ghost mb-4" onClick={() => navigate('/find-advocates')}>
                    ← Back to Search
                </button>

                {/* TOP HEADER SECTION */}
                <div className="profile-header-card">
                    <div className="ph-avatar-section">
                        <div className="ph-avatar">{profile.full_name[0]}</div>
                    </div>
                    <div className="ph-info-section">
                        <h1>
                            {profile.full_name}
                            {profile.is_verified && <span className="verified-badge">✅ BCI Verified</span>}
                        </h1>

                        <div className="ph-rating">
                            ⭐ <strong className="text-lg">{profile.average_rating}</strong>
                            <span className="text-dim ml-2">({profile.total_reviews} reviews) • {stats.cases_won} cases won</span>
                        </div>

                        <div className="ph-tags mt-3">
                            {profile.practice_areas.map(area => (
                                <span key={area} className="tag tag-primary">{area}</span>
                            ))}
                        </div>

                        <div className="ph-details-grid mt-4">
                            <div className="ph-detail-item">
                                <span className="icon">📍</span>
                                <div>
                                    <span className="label">Location</span>
                                    <span className="value">{profile.city}, {profile.state}</span>
                                </div>
                            </div>
                            <div className="ph-detail-item">
                                <span className="icon">💼</span>
                                <div>
                                    <span className="label">Experience</span>
                                    <span className="value">{profile.experience_years} Years</span>
                                </div>
                            </div>
                            <div className="ph-detail-item">
                                <span className="icon">🗣️</span>
                                <div>
                                    <span className="label">Languages</span>
                                    <span className="value">{profile.languages.join(', ')}</span>
                                </div>
                            </div>
                            <div className="ph-detail-item">
                                <span className="icon">💳</span>
                                <div>
                                    <span className="label">Consultation Rate</span>
                                    <span className="value">₹ {profile.hourly_rate} / hr</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="ph-action-section">
                        <div className="rate-box mb-4">
                            <span className="block text-dim text-sm mb-1">Book an appointment online</span>
                            <h3 className="text-2xl font-bold text-cyan">₹ {profile.hourly_rate}</h3>
                        </div>
                        <button className="btn btn-primary w-full shadow-cyan mb-3" onClick={handleBookConsultation}>
                            Book Consultation
                        </button>
                        <button className="btn btn-outline w-full" disabled>
                            Send Message (Coming Soon)
                        </button>
                    </div>
                </div>

                {/* TABS CONTAINER */}
                <div className="profile-tabs-container mt-6">
                    <div className="profile-tabs-nav">
                        {['about', 'reviews', 'availability', 'documents'].map(tab => (
                            <button
                                key={tab}
                                className={`pt-btn ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="profile-tab-content pt-6">

                        {/* TAB 1: ABOUT */}
                        {activeTab === 'about' && (
                            <div className="tab-pane-animate">
                                <h3 className="section-title">Professional Statement</h3>
                                <p className="text-secondary leading-relaxed mb-6">{profile.bio}</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                    <div className="info-card">
                                        <h4>Education Background</h4>
                                        <p className="mt-2 text-dim">{profile.education}</p>
                                    </div>
                                    <div className="info-card">
                                        <h4>Bar Council Registration</h4>
                                        <p className="mt-2 text-dim font-mono">{profile.bar_registration}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: REVIEWS */}
                        {activeTab === 'reviews' && (
                            <div className="tab-pane-animate">
                                {loadingTabs ? (
                                    <div className="spinner"></div>
                                ) : reviewsData ? (
                                    <div className="reviews-section">
                                        <div className="reviews-summary flex gap-8 mb-8 items-center border-b border-border pb-8">
                                            <div className="overall-rating text-center">
                                                <h2 className="text-5xl font-bold text-cyan mb-2">{reviewsData.average_rating}</h2>
                                                <div className="stars text-xl mb-1">⭐⭐⭐⭐⭐</div>
                                                <div className="text-dim text-sm">Based on {reviewsData.total_reviews} reviews</div>
                                            </div>
                                            <div className="rating-bars flex-1 ml-8">
                                                {[5, 4, 3, 2, 1].map(star => {
                                                    const count = reviewsData.rating_breakdown[star] || 0;
                                                    const pct = Math.round((count / reviewsData.total_reviews) * 100) || 0;
                                                    return (
                                                        <div key={star} className="rating-bar-row flex items-center mb-2">
                                                            <span className="w-8">{star} ★</span>
                                                            <div className="bar-bg flex-1 h-2 bg-card rounded mx-3 overflow-hidden">
                                                                <div className="bar-fill h-full bg-cyan" style={{ width: `${pct}%` }}></div>
                                                            </div>
                                                            <span className="w-12 text-right text-sm text-dim">{pct}%</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <div className="review-cards space-y-4">
                                            {reviewsData.reviews.map(rev => (
                                                <div key={rev.id} className="review-card p-4 bg-card rounded-lg border border-border">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <strong className="text-primary">{rev.username}</strong>
                                                            <span className="text-dim text-xs ml-3">{rev.date}</span>
                                                        </div>
                                                        <div className="text-cyan">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                                                    </div>
                                                    <p className="text-secondary">{rev.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                        {reviewsData.reviews.length < reviewsData.total_reviews && (
                                            <button className="btn btn-outline w-full mt-6">Load More Reviews</button>
                                        )}
                                    </div>
                                ) : <p>No reviews available.</p>}
                            </div>
                        )}

                        {/* TAB 3: AVAILABILITY */}
                        {activeTab === 'availability' && (
                            <div className="tab-pane-animate">
                                {loadingTabs ? (
                                    <div className="spinner"></div>
                                ) : availabilityData && availabilityData.length > 0 ? (
                                    <div className="availability-calendar">
                                        <h3 className="mb-4">Schedule for the next 7 days</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {availabilityData.map((slot, idx) => (
                                                <button
                                                    key={idx}
                                                    disabled={slot.is_booked}
                                                    onClick={handleBookConsultation}
                                                    className={`slot-btn p-3 rounded text-center transition-all ${slot.is_booked
                                                        ? 'bg-card text-dim opacity-50 cursor-not-allowed border border-transparent'
                                                        : 'bg-primary border border-cyan hover:shadow-cyan hover:bg-[#1a2333] cursor-pointer'
                                                        }`}
                                                >
                                                    <div className="font-bold mb-1">{slot.time}</div>
                                                    <div className="text-xs">{slot.date}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : <p>No availability data found.</p>}
                            </div>
                        )}

                        {/* TAB 4: DOCUMENTS */}
                        {activeTab === 'documents' && (
                            <div className="tab-pane-animate">
                                <h3 className="section-title">Verified Credentials</h3>
                                <p className="text-dim mb-6">These documents have been securely verified by the platform. The actual files are hidden to protect privacy.</p>

                                <div className="credentials-list space-y-4">
                                    {credentials.map(cred => (
                                        <div key={cred.id} className="cred-card flex items-center p-4 bg-card rounded-lg border border-border">
                                            <div className="cred-icon w-12 h-12 rounded-full bg-[#1e2a40] text-cyan flex items-center justify-center text-xl mr-4">
                                                {cred.type.includes('Degree') ? '🎓' : '📜'}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-primary font-bold">{cred.type}</h4>
                                                <p className="text-dim text-sm">{cred.issuing_body} • Issued: {cred.year}</p>
                                            </div>
                                            <div className="verified-badge ml-auto">✅ Verified</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
