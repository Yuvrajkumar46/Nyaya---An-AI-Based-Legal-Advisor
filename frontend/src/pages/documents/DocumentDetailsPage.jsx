import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import DocumentPreviewModal from '../../components/DocumentPreviewModal';
import api from '../../utils/api';

export default function DocumentDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [doc, setDoc] = useState(null);
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit States
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});

    const [previewDocId, setPreviewDocId] = useState(null);
    const [uploadingVersion, setUploadingVersion] = useState(false);

    useEffect(() => {
        const fetchDocArea = async () => {
            try {
                const [docRes, versRes] = await Promise.all([
                    api.get(`/v1/documents/${id}`),
                    api.get(`/v1/documents/${id}/versions`)
                ]);

                const fetchedDoc = docRes.data.document;
                setDoc(fetchedDoc);
                setEditData({
                    document_name: fetchedDoc.document_name,
                    document_type: fetchedDoc.document_type,
                    tags: fetchedDoc.tags || '',
                    notes: fetchedDoc.notes || ''
                });

                setVersions(versRes.data.versions);
            } catch (err) {
                console.error("Details Fetch Err:", err);
                alert("Document not found or access denied.");
                navigate('/documents');
            } finally {
                setLoading(false);
            }
        };
        fetchDocArea();
    }, [id, navigate]);

    const handleSaveMetadata = async () => {
        try {
            await api.patch(`/v1/documents/${id}`, editData);
            setDoc({ ...doc, ...editData });
            setIsEditing(false);
        } catch (err) {
            alert('Failed to save metadata');
        }
    };

    const handleNewVersionFile = async (selectedFile) => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        setUploadingVersion(true);
        try {
            const res = await api.post(`/v1/documents/${id}/version`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Reload versions
            const versRes = await api.get(`/v1/documents/${id}/versions`);
            setVersions(versRes.data.versions);
            alert(`Version ${res.data.version_number} uploaded successfully!`);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to upload new version.');
        } finally {
            setUploadingVersion(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) return <Layout><div className="flex items-center justify-center min-h-screen"><div className="spinner"></div></div></Layout>;

    return (
        <Layout>
            <div className="module-page p-6 max-w-7xl mx-auto min-h-screen text-white flex flex-col lg:flex-row gap-8">

                {/* LEFT SIDE - Current Preview */}
                <div className="flex-1 bg-[#161f30] border border-gray-700/50 rounded-2xl p-6 shadow-xl flex flex-col">
                    <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6">
                        <h2 className="text-2xl font-bold">Document Inspector</h2>
                        <button
                            onClick={() => setPreviewDocId(doc.document_id)}
                            className="btn bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-4 py-2"
                        >
                            🔍 Interactive Preview
                        </button>
                    </div>

                    <div className="flex-1 bg-gray-900 rounded-xl border border-gray-700/50 flex items-center justify-center p-8 min-h-[400px]">
                        <div className="text-center">
                            <div className="text-6xl mb-4 opacity-50">📄</div>
                            <h3 className="text-xl font-bold text-gray-300">{doc.document_name}</h3>
                            <p className="text-gray-500 mt-2">UUID: {doc.document_id}</p>
                            <p className="text-cyan-500/80 mt-4 text-sm font-mono tracking-widest uppercase">{doc.file_format}</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - Properties & History */}
                <div className="w-full lg:w-[400px] flex flex-col gap-6">

                    {/* Metadata Card */}
                    <div className="bg-[#161f30] border border-gray-700/50 rounded-2xl p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-cyan-400">Properties</h3>
                            <button onClick={() => isEditing ? handleSaveMetadata() : setIsEditing(true)} className="text-gray-400 hover:text-white text-sm">
                                {isEditing ? '💾 Save All' : '✏️ Edit Metadata'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Document Name</label>
                                {isEditing ? (
                                    <input type="text" value={editData.document_name} onChange={e => setEditData({ ...editData, document_name: e.target.value })} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm" />
                                ) : (
                                    <p className="text-gray-200">{doc.document_name}</p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Type</label>
                                    {isEditing ? (
                                        <select value={editData.document_type} onChange={e => setEditData({ ...editData, document_type: e.target.value })} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm">
                                            <option value="Pleading">Pleading</option>
                                            <option value="Evidence">Evidence</option>
                                            <option value="Order">Order</option>
                                            <option value="Correspondence">Correspondence</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    ) : (
                                        <p className="text-gray-200">{doc.document_type}</p>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Format</label>
                                    <span className="bg-gray-800 px-3 py-1 rounded text-sm text-gray-300 font-mono inline-block">{doc.file_format}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Created At</label>
                                <p className="text-gray-400 text-sm">{new Date(doc.created_at).toLocaleString('en-IN')}</p>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Tags</label>
                                {isEditing ? (
                                    <input type="text" value={editData.tags} onChange={e => setEditData({ ...editData, tags: e.target.value })} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm" />
                                ) : (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {doc.tags ? doc.tags.split(',').map(tag => (
                                            <span key={tag} className="bg-blue-900/30 text-blue-300 border border-blue-900/50 px-2 rounded-xl text-xs">{tag.trim()}</span>
                                        )) : <span className="text-gray-600 text-xs italic">No tags assigned</span>}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Notes</label>
                                {isEditing ? (
                                    <textarea value={editData.notes} onChange={e => setEditData({ ...editData, notes: e.target.value })} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm min-h-[80px]" />
                                ) : (
                                    <p className="text-gray-400 text-sm border-l-2 border-gray-700 pl-3">{doc.notes || 'No description provided.'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Version History Tree */}
                    <div className="bg-[#161f30] border border-gray-700/50 rounded-2xl p-6 shadow-xl">
                        <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
                            <h3 className="text-lg font-bold text-gray-200">Version History</h3>
                            <div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleNewVersionFile(e.target.files[0])}
                                    accept=".pdf,.docx,.jpg,.jpeg,.png,.txt"
                                />
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    disabled={uploadingVersion}
                                    className="text-cyan-500 hover:text-cyan-400 text-sm font-medium transition-colors"
                                >
                                    {uploadingVersion ? 'Uploading...' : '+ New Version'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {versions.map((ver, idx) => (
                                <div key={ver.version_id} className={`p-4 rounded-lg flex items-center justify-between ${idx === 0 ? 'bg-cyan-900/10 border-cyan-500/30 border' : 'bg-gray-800 border-gray-700 border'}`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`font-bold ${idx === 0 ? 'text-cyan-400' : 'text-gray-300'}`}>v{ver.version_number}</span>
                                            {idx === 0 && <span className="bg-cyan-500/20 text-cyan-300 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Current</span>}
                                        </div>
                                        <p className="text-gray-500 text-xs">{new Date(ver.created_at).toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-400 text-xs mb-1 font-mono">{(ver.file_size_bytes / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {previewDocId && <DocumentPreviewModal documentId={previewDocId} onClose={() => setPreviewDocId(null)} />}
        </Layout>
    );
}
