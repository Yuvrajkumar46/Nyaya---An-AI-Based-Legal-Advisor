import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function CallHistoryPage() {
    const navigate = useNavigate();

    const [calls, setCalls] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Filters & Pagination
    const [page, setPage] = useState(1);
    const limit = 10;
    const [sortBy, setSortBy] = useState('newest'); // newest, oldest
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchHistory();
        // eslint-disable-next-line
    }, [page, sortBy, dateRange]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            // Include basic filtering in query strings
            const { data } = await api.get(`/v1/calls/history?page=${page}&limit=${limit}&sort=${sortBy}&start=${dateRange.start}&end=${dateRange.end}`);
            setCalls(data.calls || []);
            setTotalCount(data.total_count || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalCount / limit);

    return (
        <Layout>
            <div className="module-page p-8 max-w-5xl mx-auto">

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Call History</h1>
                        <p className="text-gray-400">Review your past video consultations and invoices.</p>
                    </div>
                    <div className="bg-[#1e2a40] text-cyan-400 px-4 py-2 rounded-lg border border-cyan-500/30 font-bold">
                        Total Calls: {totalCount}
                    </div>
                </div>

                {/* FILTERS */}
                <div className="bg-[#161f30] border border-gray-700 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between mb-8 shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Date Range</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="bg-gray-800 border border-gray-600 rounded px-3 py-2 outline-none focus:border-cyan-500 text-sm text-gray-200"
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="bg-gray-800 border border-gray-600 rounded px-3 py-2 outline-none focus:border-cyan-500 text-sm text-gray-200"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="bg-gray-800 border border-gray-600 rounded px-3 py-2 outline-none focus:border-cyan-500 text-sm text-gray-200 cursor-pointer h-[38px]"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>
                    </div>

                    <button onClick={() => setDateRange({ start: '', end: '' })} className="text-cyan-400 text-sm hover:underline mt-4">
                        Clear Filters
                    </button>
                </div>

                {/* LIST */}
                {loading ? (
                    <div className="spinner my-20"></div>
                ) : calls.length === 0 ? (
                    <div className="text-center py-20 bg-[#161f30] border border-gray-700 rounded-xl shadow-lg">
                        <span className="text-5xl opacity-40">📭</span>
                        <h3 className="text-xl font-bold mt-4 text-gray-300">No calls found</h3>
                        <p className="text-gray-500 mt-2">You don't have any past consultations matching these filters.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {calls.map(call => (
                            <div key={call.call_id} className="bg-[#1e2a40] border border-gray-700 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-md hover:shadow-cyan-500/10 transition-shadow">

                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-600 to-purple-700 flex items-center justify-center text-xl font-bold text-white shadow-inner">
                                        {call.advocate_name[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-100 placeholder-white">Adv. {call.advocate_name}</h3>
                                        <p className="text-cyan-400 text-sm mt-0.5">{call.practice_areas || 'Legal Consultation'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full md:w-auto flex-1 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 mb-1">📅 Date</span>
                                        <span className="text-gray-300 font-medium">{new Date(call.start_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 mb-1">⏱️ Duration</span>
                                        <span className="text-gray-300 font-medium">{Math.floor(call.duration_seconds / 60)}m {call.duration_seconds % 60}s</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 mb-1">💰 Charged</span>
                                        <span className="text-gray-300 font-bold">₹{parseFloat(call.billing_amount).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 mb-1">⭐ Rating</span>
                                        <span className="text-yellow-500 font-medium">{call.rating ? `${call.rating} / 5` : <span className="text-gray-600">Unrated</span>}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 w-full md:w-auto justify-end">
                                    <button
                                        className="btn btn-outline hover:bg-cyan-900 border-cyan-700 text-cyan-300 px-4 py-2 text-sm"
                                        onClick={() => navigate(`/calls/summary/${call.call_id}`)}
                                    >
                                        View Summary
                                    </button>
                                    <button className="btn bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 text-sm">
                                        Invoice
                                    </button>
                                </div>

                            </div>
                        ))}
                    </div>
                )}

                {/* PAGINATION */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 text-white disabled:opacity-50 hover:bg-gray-700 border border-gray-600 transition-colors"
                        >
                            ←
                        </button>
                        <span className="text-gray-400 text-sm">Page <strong className="text-white">{page}</strong> of {totalPages}</span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 text-white disabled:opacity-50 hover:bg-gray-700 border border-gray-600 transition-colors"
                        >
                            →
                        </button>
                    </div>
                )}

            </div>
        </Layout>
    );
}
