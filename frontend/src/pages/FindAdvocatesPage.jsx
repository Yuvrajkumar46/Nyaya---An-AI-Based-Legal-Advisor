import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const PRACTICE_AREAS = ['Criminal Law', 'Civil Law', 'Corporate Law', 'Family Law', 'Labour Law', 'Tax Law', 'Intellectual Property', 'Real Estate'];
const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Marathi', 'Gujarati'];
const STATES = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Gujarat', 'West Bengal', 'Uttar Pradesh'];

export default function FindAdvocatesPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // State for API data
    const [advocates, setAdvocates] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // UI State
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    // Controlled inputs for debounced search
    const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

    // Form sync with URL params
    const filters = {
        search: searchParams.get('search') || '',
        practice_area: searchParams.get('practice_area') ? searchParams.get('practice_area').split(',') : [],
        state: searchParams.get('state') || '',
        city: searchParams.get('city') || '',
        min_experience: searchParams.get('min_experience') || '0',
        max_experience: searchParams.get('max_experience') || '30',
        min_rate: searchParams.get('min_rate') || '500',
        max_rate: searchParams.get('max_rate') || '10000',
        language: searchParams.get('language') ? searchParams.get('language').split(',') : [],
        min_rating: searchParams.get('min_rating') || '',
        availability: searchParams.get('availability') || 'any',
        verified_only: searchParams.get('verified_only') !== 'false',
        sort_by: searchParams.get('sort_by') || 'relevance',
        page: parseInt(searchParams.get('page')) || 1
    };

    // Set URL params helper
    const updateFilters = (newFilters) => {
        const currentParams = Object.fromEntries(searchParams.entries());
        const merged = { ...currentParams, ...newFilters, page: 1 }; // reset page on filter change

        // Clean empty values
        Object.keys(merged).forEach(key => {
            if (merged[key] === '' || merged[key] === null || merged[key] === undefined || (Array.isArray(merged[key]) && merged[key].length === 0)) {
                delete merged[key];
            } else if (Array.isArray(merged[key])) {
                merged[key] = merged[key].join(',');
            }
        });

        setSearchParams(merged);
    };

    // Fetch data when URL changes
    useEffect(() => {
        const fetchAdvocates = async () => {
            setLoading(true);
            setError('');
            try {
                const queryStr = searchParams.toString();
                const baseUrl = 'http://localhost:5000/api/v1/professionals/search';
                const url = queryStr ? `${baseUrl}?${queryStr}` : baseUrl;
                
                const response = await fetch(url);
                const data = await response.json();
                console.log('Advocates response:', data);
                
                if (response.ok) {
                    setAdvocates(data.advocates || []);
                    setTotalCount(data.total || data.advocates?.length || 0);
                    setTotalPages(1);
                } else {
                    setError('Failed to load advocates');
                }
            } catch (err) {
                console.error('Fetch advocates error:', err);
                setError('Unable to load advocates. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchAdvocates();
    }, [searchParams]);

    // Handle Debounced Search
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchInput !== (searchParams.get('search') || '')) {
                updateFilters({ search: searchInput });
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [searchInput]);

    const handleCheckboxToggle = (category, value) => {
        const currentList = [...filters[category]];
        if (currentList.includes(value)) {
            updateFilters({ [category]: currentList.filter(item => item !== value) });
        } else {
            updateFilters({ [category]: [...currentList, value] });
        }
    };

    const clearAllFilters = () => {
        setSearchInput('');
        setSearchParams({});
    };

    const handleBookNow = (advocateId) => {
        if (!user) {
            navigate(`/login?redirect=/find-advocates`);
        } else {
            navigate(`/appointments/book?advocate_id=${advocateId}`);
        }
    };

    return (
        <Layout>
            <div className="find-advocates-page">
                {/* Mobile Filter Toggle */}
                <div className="mobile-filter-bar">
                    <button className="btn btn-outline" onClick={() => setIsMobileFilterOpen(true)}>
                        <span>🔍</span> Filters & Sorting
                    </button>
                    <span>{totalCount} Advocates</span>
                </div>

                <div className={`filter-sidebar ${isMobileFilterOpen ? 'open' : ''}`}>
                    <div className="filter-header-mobile">
                        <h3>Filters</h3>
                        <button className="btn btn-ghost btn-sm" onClick={() => setIsMobileFilterOpen(false)}>✕</button>
                    </div>

                    <div className="filter-panel">
                        {/* 1. SEARCH */}
                        <div className="form-group mb-4">
                            <label className="filter-label">Search by name or keyword</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="E.g. Divorce, Copyright..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                        </div>

                        {/* 9. VERIFICATION STATUS */}
                        <div className="filter-group toggle-group-slim mb-4">
                            <label className="toggle-label-slim">
                                <span>Show Verified Only</span>
                                <input
                                    type="checkbox"
                                    checked={filters.verified_only}
                                    onChange={(e) => updateFilters({ verified_only: e.target.checked ? 'true' : 'false' })}
                                />
                            </label>
                        </div>

                        {/* 2. PRACTICE AREA */}
                        <div className="filter-group">
                            <label className="filter-label">Practice Area</label>
                            <div className="checkbox-list">
                                {PRACTICE_AREAS.map(area => (
                                    <label key={area} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={filters.practice_area.includes(area)}
                                            onChange={() => handleCheckboxToggle('practice_area', area)}
                                        />
                                        <span>{area}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 3. LOCATION */}
                        <div className="filter-group">
                            <label className="filter-label">Location (State)</label>
                            <select
                                className="form-input"
                                value={filters.state}
                                onChange={(e) => updateFilters({ state: e.target.value, city: '' })}
                            >
                                <option value="">All States</option>
                                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {filters.state && (
                                <input
                                    type="text"
                                    className="form-input mt-2"
                                    placeholder="City (optional)"
                                    value={filters.city}
                                    onChange={(e) => updateFilters({ city: e.target.value })}
                                />
                            )}
                        </div>

                        {/* 4. EXPERIENCE */}
                        <div className="filter-group">
                            <label className="filter-label flex justify-between">
                                Experience
                                <span className="text-cyan">{filters.min_experience} - {filters.max_experience}+ Yrs</span>
                            </label>
                            <div className="range-inputs">
                                <input type="number" min="0" max="30" value={filters.min_experience} onChange={(e) => updateFilters({ min_experience: e.target.value })} className="form-input input-sm min-max" placeholder="Min" />
                                <span>to</span>
                                <input type="number" min="0" max="30" value={filters.max_experience} onChange={(e) => updateFilters({ max_experience: e.target.value })} className="form-input input-sm min-max" placeholder="Max" />
                            </div>
                        </div>

                        {/* 5. CONSULTATION RATE */}
                        <div className="filter-group">
                            <label className="filter-label flex justify-between">
                                Hourly Rate (₹)
                            </label>
                            <div className="range-inputs">
                                <input type="number" step="500" value={filters.min_rate} onChange={(e) => updateFilters({ min_rate: e.target.value })} className="form-input input-sm min-max" placeholder="Min ₹" />
                                <span>to</span>
                                <input type="number" step="500" value={filters.max_rate} onChange={(e) => updateFilters({ max_rate: e.target.value })} className="form-input input-sm min-max" placeholder="Max ₹" />
                            </div>
                        </div>

                        {/* 6. LANGUAGE */}
                        <div className="filter-group">
                            <label className="filter-label">Language</label>
                            <div className="checkbox-list two-cols">
                                {LANGUAGES.map(lang => (
                                    <label key={lang} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={filters.language.includes(lang)}
                                            onChange={() => handleCheckboxToggle('language', lang)}
                                        />
                                        <span>{lang}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 7. RATING */}
                        <div className="filter-group">
                            <label className="filter-label">Minimum Rating</label>
                            <select
                                className="form-input"
                                value={filters.min_rating}
                                onChange={(e) => updateFilters({ min_rating: e.target.value })}
                            >
                                <option value="">Any Rating</option>
                                <option value="4.5">⭐⭐⭐⭐½ (4.5 & up)</option>
                                <option value="4.0">⭐⭐⭐⭐ (4.0 & up)</option>
                                <option value="3.0">⭐⭐⭐ (3.0 & up)</option>
                            </select>
                        </div>

                        {/* 8. AVAILABILITY */}
                        <div className="filter-group">
                            <label className="filter-label">Availability</label>
                            <div className="radio-list">
                                {['any', 'today', 'week'].map(avail => (
                                    <label key={avail} className="radio-label">
                                        <input
                                            type="radio"
                                            name="availability"
                                            value={avail}
                                            checked={filters.availability === avail}
                                            onChange={() => updateFilters({ availability: avail })}
                                        />
                                        <span className="capitalize">{avail === 'any' ? 'Any Time' : avail === 'week' ? 'Available This Week' : 'Available Today'}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button className="btn btn-ghost w-full mb-2" onClick={clearAllFilters}>Clear All Filters</button>
                        <button className="btn btn-primary w-full" onClick={() => setIsMobileFilterOpen(false)}>Apply Filters</button>
                    </div>
                </div>

                {/* Right Side Results */}
                <div className="results-container">

                    {/* TASK 4 — Results Header Bar */}
                    <div className="results-header">
                        <div className="results-count">
                            {!loading && `Showing ${advocates.length} of ${totalCount} advocates`}
                        </div>
                        <div className="results-actions">
                            <div className="sort-group">
                                <label>Sort by:</label>
                                <select
                                    className="form-input input-sm"
                                    value={filters.sort_by}
                                    onChange={(e) => updateFilters({ sort_by: e.target.value })}
                                >
                                    <option value="relevance">Relevance</option>
                                    <option value="rating">Rating (Highest)</option>
                                    <option value="experience">Experience (Desc)</option>
                                    <option value="price_asc">Price (Low-High)</option>
                                    <option value="price_desc">Price (High-Low)</option>
                                </select>
                            </div>
                            <div className="view-toggles hidden-mobile">
                                <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>⊞</button>
                                <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>☰</button>
                            </div>
                        </div>
                    </div>

                    {/* TASK 6 — Loading & Empty States */}
                    {error && (
                        <div className="empty-state">
                            <span className="text-4xl block mb-4">⚠️</span>
                            <h3>{error}</h3>
                            <button className="btn btn-primary mt-4" onClick={() => updateFilters({})}>Retry</button>
                        </div>
                    )}

                    {!error && loading && (
                        <div className={`advocates-${viewMode}`}>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="advocate-card skeleton">
                                    <div className="skeleton-avatar"></div>
                                    <div className="skeleton-lines">
                                        <div className="sl-1"></div>
                                        <div className="sl-2"></div>
                                        <div className="sl-3"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!error && !loading && advocates.length === 0 && (
                        <div className="empty-state">
                            <span className="text-4xl block mb-4">🔍</span>
                            <h3>No advocates found matching your filters</h3>
                            <p>Try adjusting your search criteria or dropping some filters.</p>
                            <button className="btn btn-outline mt-4" onClick={clearAllFilters}>Clear Filters</button>
                        </div>
                    )}

                    {/* TASK 3 — Advocate Cards */}
                    {!error && !loading && advocates.length > 0 && (
                        <div className={`advocates-${viewMode}`}>
                            {advocates.map(adv => (
                                <div key={adv.id} className="advocate-card">
                                    <div className="adv-card-header">
                                        <div className="adv-avatar">{adv.full_name[0]}</div>
                                        <div className="adv-title-col">
                                            <h4>
                                                {adv.full_name}
                                                {adv.is_verified && <span className="verified-badge">✅ BCI Verified</span>}
                                            </h4>
                                            <div className="adv-rating">
                                                ⭐ <strong>{adv.average_rating}</strong> <span className="review-count">({adv.total_reviews} reviews)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="adv-details">
                                        <div className="adv-detail-row">
                                            <span>🏛️</span> {adv.practice_areas.slice(0, 2).join(', ')}{adv.practice_areas.length > 2 ? ' +more' : ''}
                                        </div>
                                        <div className="adv-detail-row">
                                            <span>📍</span> {adv.city}, {adv.bar_council_state}
                                        </div>
                                        <div className="adv-detail-row">
                                            <span>🗣️</span> {adv.languages.slice(0, 3).join(', ')}{adv.languages.length > 3 ? '...' : ''}
                                        </div>
                                        <div className="adv-detail-row">
                                            <span>💼</span> {adv.experience_years} years experience
                                        </div>
                                        <div className="adv-rate">
                                            ₹ {adv.hourly_rate} <span>/ hour</span>
                                        </div>
                                    </div>

                                    <div className="adv-card-footer">
                                        <button className="btn btn-ghost w-full" onClick={() => navigate(`/advocates/${adv.id}`)}>
                                            View Profile
                                        </button>
                                        <button className="btn btn-primary w-full" onClick={() => handleBookNow(adv.id)}>
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {!error && !loading && totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="btn btn-outline"
                                disabled={filters.page === 1}
                                onClick={() => updateFilters({ page: filters.page - 1 })}
                            >Previous</button>

                            <div className="page-numbers">
                                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    // simple logic around current page for demo
                                    let pNum = filters.page > 3 && totalPages > 5 ? filters.page - 2 + i : i + 1;
                                    if (pNum > totalPages) return null;
                                    return (
                                        <button
                                            key={pNum}
                                            className={`page-btn ${filters.page === pNum ? 'active' : ''}`}
                                            onClick={() => updateFilters({ page: pNum })}
                                        >
                                            {pNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                className="btn btn-outline"
                                disabled={filters.page >= totalPages}
                                onClick={() => updateFilters({ page: filters.page + 1 })}
                            >Next</button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
