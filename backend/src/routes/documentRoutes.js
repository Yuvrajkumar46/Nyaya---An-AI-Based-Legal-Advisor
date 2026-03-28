const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure Multer for File Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.user.id;
        const dir = path.join(__dirname, '../../uploads/documents', String(userId));
        // Create user-specific securely partitioned directory if not exists
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Enforce UUID naming convention prefixing original name uniquely
        const uniquePrefix = uuidv4();
        cb(null, `${uniquePrefix}_${file.originalname}`);
    }
});

// Enforce Hard Validation Rules
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
        'image/jpeg',
        'image/png',
        'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOCX, JPG, PNG, and TXT are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB Strict Cap
});

// Middleware to catch Multer errors (e.g., filesize limits)
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ success: false, message: 'File is too large. Maximum size is 10MB.' });
        }
    } else if (err) {
        return res.status(415).json({ success: false, message: err.message });
    }
    next();
};

router.use(protect);

router.post('/upload', upload.single('file'), handleUploadError, documentController.uploadDocument);
router.get('/', documentController.getDocuments);
router.get('/:document_id', documentController.getDocumentDetails);
router.patch('/:document_id', documentController.updateDocumentMetadata);
router.delete('/:document_id', documentController.deleteDocument);

router.get('/:document_id/preview', documentController.previewDocument);
router.get('/:document_id/download', documentController.downloadDocument);

router.post('/:document_id/share', documentController.shareDocument);
router.delete('/:document_id/share/:sharing_id', documentController.revokeShareAccess);

router.post('/:document_id/version', upload.single('file'), handleUploadError, documentController.uploadNewVersion);
router.get('/:document_id/versions', documentController.getDocumentVersions);

module.exports = router;
