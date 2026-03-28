import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import api from '../utils/api';
// Initialize PDF worker mapping to unpkg CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function DocumentPreviewModal({ documentId, onClose }) {
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        const fetchDocMeta = async () => {
            try {
                const { data } = await api.get(`/v1/documents/${documentId}`);
                setDoc(data.document);

                // If it's a renderable format, pull down the blob
                if (['PDF', 'JPG', 'PNG', 'TXT'].includes(data.document.file_format)) {
                    const response = await api.get(`/v1/documents/${documentId}/preview`, { responseType: 'blob' });
                    const fileUrl = URL.createObjectURL(response.data);
                    setPreviewUrl(fileUrl);
                }
            } catch (err) {
                console.error("Preview Meta Err:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDocMeta();

        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
        // eslint-disable-next-line
    }, [documentId]);

    const handleDownload = async () => {
        try {
            const response = await api.get(`/v1/documents/${documentId}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.document_name);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            alert('Failed to download document');
        }
    };

    if (loading) return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
            <div className="spinner"></div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center p-4">

            {/* Header controls */}
            <div className="w-full max-w-6xl flex justify-between items-center mb-4 text-white">
                <div>
                    <h2 className="text-xl font-bold bg-gray-900 px-4 py-2 rounded-lg border border-gray-700">
                        {doc?.document_name} <span className="text-sm font-normal text-gray-400 ml-2">{doc?.file_format}</span>
                    </h2>
                </div>

                <div className="flex gap-4">
                    <button onClick={handleDownload} className="btn bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2">
                        ⬇️ Download
                    </button>
                    <button onClick={onClose} className="btn bg-red-600 hover:bg-red-500 text-white">
                        ✖ Close
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 w-full max-w-6xl bg-gray-800 rounded-lg overflow-auto border border-gray-700 relative flex justify-center items-center">

                {doc?.file_format === 'PDF' && previewUrl && (
                    <div className="py-4">
                        <div className="sticky top-0 bg-gray-900/90 py-2 px-4 rounded-full mx-auto w-max mb-4 z-10 flex gap-4 border border-gray-700 backdrop-blur">
                            <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1} className="text-gray-300 hover:text-white disabled:opacity-50">◀ Prev</button>
                            <span className="text-gray-200">Page {pageNumber} of {numPages || '--'}</span>
                            <button onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))} disabled={pageNumber >= numPages} className="text-gray-300 hover:text-white disabled:opacity-50">Next ▶</button>

                            <div className="w-px bg-gray-600 mx-2"></div>

                            <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="text-gray-300 hover:text-white">🔍-</button>
                            <span className="text-gray-200">{Math.round(scale * 100)}%</span>
                            <button onClick={() => setScale(s => Math.min(2.5, s + 0.2))} className="text-gray-300 hover:text-white">🔍+</button>
                        </div>

                        <Document
                            file={previewUrl}
                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                            loading={<div className="text-center p-10 text-cyan-500">Loading PDF engine...</div>}
                            className="flex justify-center flex-col items-center"
                        >
                            <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} className="shadow-2xl border border-gray-600 rounded" />
                        </Document>
                    </div>
                )}

                {(doc?.file_format === 'JPG' || doc?.file_format === 'PNG') && previewUrl && (
                    <img src={previewUrl} alt={doc?.document_name} className="max-w-full max-h-full object-contain p-4" />
                )}

                {doc?.file_format === 'TXT' && previewUrl && (
                    <iframe src={previewUrl} className="w-full h-full bg-white text-black p-4 outline-none" title="txt-view" />
                )}

                {doc?.file_format === 'DOCX' && (
                    <div className="text-center p-12">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-2xl font-bold text-gray-200 mb-2">DOCX Preview Not Available</h3>
                        <p className="text-gray-400 mb-6 max-w-sm text-center mx-auto">DOCX files cannot be securely rendered inside the browser runtime without 3rd party plugins. Please download the file to inspect it natively.</p>
                        <button onClick={handleDownload} className="btn bg-blue-600 text-white">Download {doc?.document_name}</button>
                    </div>
                )}

            </div>
        </div>
    );
}
