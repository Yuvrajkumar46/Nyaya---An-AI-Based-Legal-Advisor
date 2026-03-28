import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
// We will build DocumentPreviewModal and ShareDocumentModal next
import DocumentPreviewModal from '../../components/DocumentPreviewModal';
import ShareDocumentModal from '../../components/ShareDocumentModal';

const getFileIcon = (format) => {
    switch (format) {
        case 'PDF': return <span className="text-red-500 font-bold text-4xl mb-2 inline-block">📄</span>;
        case 'DOCX': return <span className="text-blue-500 font-bold text-4xl mb-2 inline-block">📝</span>;
        case 'JPG':
        case 'PNG': return <span className="text-green-500 font-bold text-4xl mb-2 inline-block">🖼️</span>;
        case 'TXT': return <span className="text-gray-400 font-bold text-4xl mb-2 inline-block">📃</span>;
        default: return <span className="text-purple-400 font-bold text-4xl mb-2 inline-block">📁</span>;
    }
};

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function DocumentsPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('mine'); // mine, shared_by_me, shared_with_me
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [filterFormat, setFilterFormat] = useState('All');
    const [sortBy, setSortBy] = useState('newest');

    // Modals
    const [previewDocId, setPreviewDocId] = useState(null);
    const [shareDocId, setShareDocId] = useState(null);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/v1/documents?type=${filterType}&format=${filterFormat}&search=${searchQuery}&sort=${sortBy}`);
            setDocuments(data.documents || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Debounced Search trigger
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDocuments();
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line
    }, [filterType, filterFormat, sortBy, searchQuery]);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
        try {
            await api.delete(`/v1/documents/${id}`);
            fetchDocuments();
            alert("Document deleted");
        } catch (err) {
            alert("Delete failed: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <Layout>
            <div className="module-page p-6 max-w-7xl mx-auto min-h-screen text-white">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-1">My Documents</h1>
                        <p className="text-gray-400">Securely store, version, and share case files.</p>
                    </div>
                    <Link
                        to="/documents/upload"
                        className="btn border border-cyan-500 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2 px-6 rounded-lg shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all"
                    >
                        + Upload Document
                    </Link>
                </div>

                {/* TABS */}
                <div className="flex gap-2 border-b border-gray-700 mb-6">
                    {[
                        { id: 'mine', label: 'My Documents' },
                        { id: 'shared_by_me', label: 'Shared by Me' },
                        { id: 'shared_with_me', label: 'Shared with Me' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`px-6 py-3 font-medium text-sm transition-all focus:outline-none ${activeTab === t.id ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* FILTERS BAR */}
                {activeTab === 'mine' && (
                    <div className="bg-[#161f30] border border-gray-700 p-4 rounded-xl flex flex-wrap gap-4 items-center mb-8 shadow-lg">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search documents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                        </div>

                        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none">
                            <option value="All">All Types</option>
                            <option value="Pleading">Pleading</option>
                            <option value="Evidence">Evidence</option>
                            <option value="Order">Order</option>
                            <option value="Correspondence">Correspondence</option>
                            <option value="Other">Other</option>
                        </select>

                        <select value={filterFormat} onChange={e => setFilterFormat(e.target.value)} className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none">
                            <option value="All">All Formats</option>
                            <option value="PDF">PDF</option>
                            <option value="DOCX">DOCX</option>
                            <option value="JPG">JPG</option>
                            <option value="PNG">PNG</option>
                            <option value="TXT">TXT</option>
                        </select>

                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-cyan-400 outline-none font-medium">
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="name_asc">Name A-Z</option>
                            <option value="name_desc">Name Z-A</option>
                        </select>
                    </div>
                )}

                {/* GRID LISTING */}
                {loading ? (
                    <div className="text-center py-20"><div className="spinner mb-4"></div><p className="text-gray-500">Loading documents...</p></div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-24 bg-[#161f30] border border-gray-800 rounded-2xl shadow-inner">
                        <span className="text-6xl opacity-20 mb-4 block">🗂️</span>
                        <h3 className="text-xl font-bold text-gray-300">No documents found</h3>
                        <p className="text-gray-500 mt-2 max-w-sm mx-auto">Upload your first case file, pleading, or evidence to store it securely encrypted.</p>
                        <button onClick={() => navigate('/documents/upload')} className="mt-6 btn btn-outline">Upload Now</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {documents.map(doc => (
                            <div key={doc.document_id} className="bg-[#1e2a40] border border-gray-700/50 rounded-xl p-5 shadow-lg group hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(0,212,255,0.1)] transition-all cursor-pointer flex flex-col justify-between h-full relative overflow-hidden" onClick={() => navigate(`/documents/${doc.document_id}`)}>

                                <div className="absolute top-0 right-0 p-4 opacity-10 font-bold text-6xl select-none group-hover:opacity-20 transition-opacity">
                                    {doc.file_format}
                                </div>

                                <div>
                                    {getFileIcon(doc.file_format)}
                                    <h3 className="font-bold text-lg text-gray-100 truncate mt-1 w-[90%]" title={doc.document_name}>
                                        {doc.document_name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2 text-xs">
                                        <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded font-medium">{doc.document_type}</span>
                                        <span className="text-gray-500">•</span>
                                        <span className="text-gray-400">{formatBytes(parseInt(doc.latest_size || 0))}</span>
                                    </div>
                                    <p className="text-gray-500 text-xs mt-3">
                                        Uploaded: {new Date(doc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-700/50" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => setPreviewDocId(doc.document_id)}
                                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-cyan-400 text-sm font-medium py-2 rounded transition-colors"
                                    >
                                        Preview
                                    </button>
                                    <button
                                        onClick={() => setShareDocId(doc.document_id)}
                                        className="flex-1 bg-blue-900/30 hover:bg-blue-800/50 text-blue-400 border border-blue-800/50 text-sm font-medium py-2 rounded transition-colors"
                                    >
                                        Share
                                    </button>
                                    <button
                                        onClick={() => handleDelete(doc.document_id, doc.document_name)}
                                        className="px-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 text-sm font-medium py-2 rounded transition-colors"
                                        title="Delete Permanently"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Hidden Modals that pop conditionally */}
            {previewDocId && <DocumentPreviewModal documentId={previewDocId} onClose={() => setPreviewDocId(null)} />}
            {shareDocId && <ShareDocumentModal documentId={shareDocId} onClose={() => setShareDocId(null)} />}
        </Layout>
    );
}
