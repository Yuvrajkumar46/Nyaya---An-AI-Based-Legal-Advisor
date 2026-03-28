import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';

export default function UploadDocumentPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [documentName, setDocumentName] = useState('');
    const [documentType, setDocumentType] = useState('Pleading');
    const [caseReference, setCaseReference] = useState('');
    const [tags, setTags] = useState('');
    const [notes, setNotes] = useState('');

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            setSelectedFile(file);
            setDocumentName(file.name.replace(/\.[^/.]+$/, ''));
        }
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setDocumentName(file.name.replace(/\.[^/.]+$/, ''));
        }
    };

    const handleUpload = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        // Step 1: Validate file selected
        if (!selectedFile) {
            setError('Please select a file first');
            return;
        }

        // Step 2: Validate document name
        if (!documentName.trim()) {
            setError('Please enter a document name');
            return;
        }

        // Step 3: Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'text/plain'
        ];
        if (!allowedTypes.includes(selectedFile.type)) {
            setError('File type not allowed. Use PDF, DOCX, JPG, PNG or TXT');
            return;
        }

        // Step 4: Validate file size (10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('File too large. Maximum size is 10MB');
            return;
        }

        // Step 5: Build form data
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('document_name', documentName);
        formData.append('document_type', documentType);
        formData.append('case_reference', caseReference || '');
        formData.append('tags', tags || '');
        formData.append('notes', notes || '');

        // Step 6: Show loading
        setIsUploading(true);
        setError('');

        try {
            // Step 7: Get token from wherever it's stored
            const token = localStorage.getItem('accessToken')
                || localStorage.getItem('token')
                || sessionStorage.getItem('token')
                || window.__nyaya_access_token;

            console.log('Token found:', token ? 'YES' : 'NO');

            if (!token) {
                setError('You are not logged in. Please login again.');
                navigate('/login');
                return;
            }

            // Step 8: Make the API call
            const response = await fetch(
                'http://localhost:5000/api/v1/documents/upload',
                {
                    method: 'POST',
                    headers: {
                        // DO NOT set Content-Type here
                        // Browser sets it automatically with boundary
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                }
            );

            const data = await response.json();

            if (response.ok) {
                // Success
                alert('Document uploaded successfully!');
                navigate('/documents');
            } else {
                setError(data.message || 'Upload failed. Please try again.');
            }

        } catch (err) {
            setError('Cannot connect to server. Make sure backend is running.');
            console.error('Upload error:', err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Layout>
            <div className="module-page p-6 max-w-3xl mx-auto min-h-screen text-white">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Upload Document</h1>
                    <button type="button" onClick={() => navigate('/documents')} className="btn btn-outline">Cancel</button>
                </div>

                {error && (
                    <div style={{
                        background: '#2d0000',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '16px'
                    }}>
                        ❌ {error}
                    </div>
                )}
                {success && <div className="bg-green-900/40 border border-green-500 text-green-200 px-4 py-3 rounded mb-6">{success}</div>}

                <form onSubmit={(e) => { e.preventDefault(); handleUpload(); }} className="bg-[#161f30] border border-gray-700 p-8 rounded-2xl shadow-xl">

                    {/* Drag and Drop Zone */}
                    <div
                        onClick={() => fileInputRef.current.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        style={{
                            border: '2px dashed #30363d',
                            borderRadius: '12px',
                            padding: '40px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: '#161b22',
                            marginBottom: '24px'
                        }}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileInput}
                            accept=".pdf,.docx,.jpg,.jpeg,.png,.txt"
                        />
                        <div style={{ fontSize: '48px' }}>📁</div>
                        <p style={{ color: 'white', fontWeight: 'bold' }}>
                            Drag & Drop files here
                        </p>
                        <p style={{ color: '#8b949e' }}>or click to browse</p>
                        <p style={{ color: '#8b949e', fontSize: '14px' }}>
                            Supported: PDF, DOCX, JPG, PNG, TXT
                        </p>
                        <p style={{ color: '#8b949e', fontSize: '14px' }}>
                            Max size: 10MB per file
                        </p>

                        {/* Show selected file here */}
                        {selectedFile && (
                            <div style={{
                                marginTop: '16px',
                                padding: '8px 16px',
                                background: '#0d2d1a',
                                border: '1px solid #00d4ff',
                                borderRadius: '8px',
                                color: '#00d4ff'
                            }}>
                                ✅ {selectedFile.name} — {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                        )}
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-5">
                        <div className="flex flex-col md:flex-row gap-5">
                            <div className="flex-1">
                                <label className="block text-gray-300 font-medium mb-1.5 text-sm">Document Name *</label>
                                <input required type="text" value={documentName} onChange={e => setDocumentName(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2.5 text-white focus:border-cyan-500 outline-none" placeholder="e.g. Contract Agreement" />
                            </div>
                            <div className="w-full md:w-1/3">
                                <label className="block text-gray-300 font-medium mb-1.5 text-sm">Document Type *</label>
                                <select value={documentType} onChange={e => setDocumentType(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2.5 text-white focus:border-cyan-500 outline-none">
                                    <option value="Pleading">Pleading</option>
                                    <option value="Evidence">Evidence</option>
                                    <option value="Order">Order</option>
                                    <option value="Correspondence">Correspondence</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-5">
                            <div className="flex-1">
                                <label className="block text-gray-300 font-medium mb-1.5 text-sm">Related Case Ref (Optional)</label>
                                <input type="text" value={caseReference} onChange={e => setCaseReference(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2.5 text-white focus:border-cyan-500 outline-none" placeholder="e.g. WP 1234/2026" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-gray-300 font-medium mb-1.5 text-sm">Tags (Optional)</label>
                                <input type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2.5 text-white focus:border-cyan-500 outline-none" placeholder="Tax, Audit, 2026..." />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-300 font-medium mb-1.5 text-sm">Notes (Optional)</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2.5 text-white focus:border-cyan-500 outline-none min-h-[100px]" placeholder="Add context regarding why this document exists..."></textarea>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button
                            type="button"
                            onClick={handleUpload}
                            disabled={isUploading || !selectedFile}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: isUploading
                                    ? '#555'
                                    : 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: isUploading || !selectedFile ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isUploading ? 'Uploading... Please wait' : 'Upload Document'}
                        </button>
                    </div>
                </form>

            </div>
        </Layout>
    );
}
