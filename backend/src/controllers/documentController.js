const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Helper to hash files natively
const generateFileHash = (filePath) => {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
};

exports.uploadDocument = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const { document_name, document_type, case_reference, tags, notes } = req.body;
        const userId = req.user.id;
        const document_id = uuidv4();
        const version_id = uuidv4();

        // Calculate Secure Hash
        const relativeStoragePath = `uploads/documents/${userId}/${req.file.filename}`;
        const absolutePath = req.file.path;
        const fileHash = generateFileHash(absolutePath);

        // Map Content Type -> Existing Format logic
        let format = 'OTHER';
        if (req.file.mimetype === 'application/pdf') format = 'PDF';
        if (req.file.mimetype.includes('wordprocessingml')) format = 'DOCX';
        if (req.file.mimetype === 'image/jpeg') format = 'JPG';
        if (req.file.mimetype === 'image/png') format = 'PNG';
        if (req.file.mimetype === 'text/plain') format = 'TXT';

        // 1. Create Core Document Record
        await sequelize.query(`
            INSERT INTO documents (document_id, user_id, document_name, document_type, file_format, case_reference, tags, notes)
            VALUES (:document_id, :userId, :document_name, :document_type, :format, :case_reference, :tags, :notes)
        `, {
            replacements: {
                document_id,
                userId,
                document_name: document_name || req.file.originalname,
                document_type: document_type || 'Other',
                format,
                case_reference: case_reference || null,
                tags: tags || null,
                notes: notes || null
            },
            type: QueryTypes.INSERT,
            transaction: t
        });

        // 2. Create Initial Version (v1) Record
        await sequelize.query(`
            INSERT INTO document_versions (version_id, document_id, version_number, storage_path, file_hash, file_size_bytes, uploaded_by)
            VALUES (:version_id, :document_id, 1, :storage_path, :file_hash, :file_size, :userId)
        `, {
            replacements: {
                version_id,
                document_id,
                storage_path: relativeStoragePath,
                file_hash: fileHash,
                file_size: req.file.size,
                userId
            },
            type: QueryTypes.INSERT,
            transaction: t
        });

        // 3. Admin Audit Log securely traces filesystem writes
        await sequelize.query(`
            INSERT INTO admin_audit_log (admin_id, action_type, target_resource, target_id, details)
            VALUES (:userId, 'DOCUMENT_UPLOAD', 'documents', :document_id, :details)
        `, {
            replacements: {
                userId, // tracking the user action within the universal admin log
                document_id,
                details: JSON.stringify({ filename: req.file.originalname, hash: fileHash, size: req.file.size })
            },
            type: QueryTypes.INSERT,
            transaction: t
        });

        await t.commit();
        res.status(201).json({ success: true, document_id, file_hash: fileHash, message: 'Document uploaded successfully' });

    } catch (err) {
        await t.rollback();
        // Clean up orphaned file mechanically upon database crash
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Upload Error:', err);
        res.status(500).json({ success: false, message: 'Server error processing file logic' });
    }
};

exports.getDocuments = async (req, res) => {
    try {
        const userId = req.user.id;
        const type = req.query.type || '';
        const format = req.query.format || '';
        const search = req.query.search || '';
        let sortClause = 'created_at DESC';

        switch (req.query.sort) {
            case 'oldest': sortClause = 'created_at ASC'; break;
            case 'name_asc': sortClause = 'document_name ASC'; break;
            case 'name_desc': sortClause = 'document_name DESC'; break;
        }

        let query = `
            SELECT d.*, 
                (SELECT file_size_bytes FROM document_versions dv WHERE dv.document_id = d.document_id ORDER BY version_number DESC LIMIT 1) as latest_size 
            FROM documents d
            WHERE d.user_id = :userId
        `;
        const replacements = { userId };

        if (type && type !== 'All') {
            query += ` AND d.document_type = :type`;
            replacements.type = type;
        }
        if (format && format !== 'All') {
            query += ` AND d.file_format = :format`;
            replacements.format = format;
        }
        if (search) {
            query += ` AND d.document_name LIKE :search`;
            replacements.search = `%${search}%`;
        }

        query += ` ORDER BY ${sortClause}`;

        const documents = await sequelize.query(query, { replacements, type: QueryTypes.SELECT });

        res.status(200).json({ success: true, documents, total_count: documents.length });
    } catch (err) {
        console.error('getDocuments Error:', err);
        res.status(500).json({ success: false, message: 'Server error retrieving documents' });
    }
};

exports.getDocumentDetails = async (req, res) => {
    try {
        const { document_id } = req.params;
        const [document] = await sequelize.query('SELECT * FROM documents WHERE document_id = :document_id AND user_id = :userId', { replacements: { document_id, userId: req.user.id }, type: QueryTypes.SELECT });

        if (!document) return res.status(403).json({ success: false, message: 'Document access denied or not found' });

        res.status(200).json({ success: true, document });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteDocument = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { document_id } = req.params;
        const userId = req.user.id;

        // Verify Ownership
        const [doc] = await sequelize.query('SELECT * FROM documents WHERE document_id = :document_id AND user_id = :userId', { replacements: { document_id, userId }, type: QueryTypes.SELECT });
        if (!doc) {
            await t.rollback();
            return res.status(403).json({ success: false, message: 'Cannot delete document. Unauthorized.' });
        }

        // Fetch all physical storage paths belonging to document versions
        const versions = await sequelize.query('SELECT storage_path FROM document_versions WHERE document_id = :document_id', { replacements: { document_id }, type: QueryTypes.SELECT, transaction: t });

        // Nuke Database Record (Cascade handles foreign keys)
        await sequelize.query('DELETE FROM documents WHERE document_id = :document_id', { replacements: { document_id }, type: QueryTypes.DELETE, transaction: t });

        await t.commit();

        // 3. Atomically slice through filesystem
        for (const version of versions) {
            const absoluteDeletePath = path.join(__dirname, '../../', version.storage_path);
            if (fs.existsSync(absoluteDeletePath)) {
                fs.unlinkSync(absoluteDeletePath);
            }
        }

        res.status(200).json({ success: true, deleted: true, message: 'Document and physical files destroyed successfully' });
    } catch (err) {
        await t.rollback();
        console.error('deleteDoc Error:', err);
        res.status(500).json({ success: false, message: 'Server error destructing resource' });
    }
};

exports.previewDocument = async (req, res) => {
    try {
        const { document_id } = req.params;
        const userId = req.user.id;

        // Ownership Check
        const [doc] = await sequelize.query('SELECT * FROM documents WHERE document_id = :document_id AND user_id = :userId', { replacements: { document_id, userId }, type: QueryTypes.SELECT });
        if (!doc) return res.status(403).json({ success: false, message: 'Unauthorized' });

        // Get Latest Version
        const [version] = await sequelize.query('SELECT storage_path FROM document_versions WHERE document_id = :document_id ORDER BY version_number DESC LIMIT 1', { replacements: { document_id }, type: QueryTypes.SELECT });
        if (!version) return res.status(404).json({ success: false, message: 'Physical file missing' });

        const absolutePath = path.join(__dirname, '../../', version.storage_path);
        if (!fs.existsSync(absolutePath)) return res.status(404).json({ success: false, message: 'File deleted from disk' });

        res.sendFile(absolutePath);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error retrieving file stream' });
    }
};

exports.downloadDocument = async (req, res) => {
    try {
        const { document_id } = req.params;
        const userId = req.user.id;

        // Ownership Check
        const [doc] = await sequelize.query('SELECT * FROM documents WHERE document_id = :document_id AND user_id = :userId', { replacements: { document_id, userId }, type: QueryTypes.SELECT });
        if (!doc) return res.status(403).json({ success: false, message: 'Unauthorized' });

        // Get Latest Version
        const [version] = await sequelize.query('SELECT storage_path FROM document_versions WHERE document_id = :document_id ORDER BY version_number DESC LIMIT 1', { replacements: { document_id }, type: QueryTypes.SELECT });
        if (!version) return res.status(404).json({ success: false, message: 'Physical file missing' });

        const absolutePath = path.join(__dirname, '../../', version.storage_path);
        if (!fs.existsSync(absolutePath)) return res.status(404).json({ success: false, message: 'File deleted from disk' });

        res.download(absolutePath, doc.document_name);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error triggering download' });
    }
};

exports.shareDocument = async (req, res) => {
    try {
        const { document_id } = req.params;
        const { advocate_id, access_level, expires_at } = req.body;
        const userId = req.user.id;

        const [doc] = await sequelize.query('SELECT * FROM documents WHERE document_id = :document_id AND user_id = :userId', { replacements: { document_id, userId }, type: QueryTypes.SELECT });
        if (!doc) return res.status(403).json({ success: false, message: 'Unauthorized' });

        const sharing_id = uuidv4();
        const share_token = crypto.randomBytes(32).toString('hex');

        await sequelize.query(`
            INSERT INTO document_sharing (sharing_id, document_id, shared_by_user_id, shared_with_advocate_id, access_level, share_token, expires_at)
            VALUES (:sharing_id, :document_id, :userId, :advocate_id, :access_level, :share_token, :expires_at)
        `, {
            replacements: { sharing_id, document_id, userId, advocate_id, access_level, share_token, expires_at },
            type: QueryTypes.INSERT
        });

        res.status(200).json({ success: true, sharing_id, share_link: `/share/${share_token}`, message: 'Document shared securely' });
    } catch (err) {
        console.error('Share Error:', err);
        res.status(500).json({ success: false, message: 'Server error creating share link' });
    }
};

exports.revokeShareAccess = async (req, res) => {
    try {
        const { document_id, sharing_id } = req.params;
        const userId = req.user.id;

        const [share] = await sequelize.query('SELECT * FROM document_sharing WHERE sharing_id = :sharing_id AND shared_by_user_id = :userId', { replacements: { sharing_id, userId }, type: QueryTypes.SELECT });
        if (!share) return res.status(403).json({ success: false, message: 'Unauthorized or invalid share' });

        await sequelize.query('UPDATE document_sharing SET is_revoked = true WHERE sharing_id = :sharing_id', { replacements: { sharing_id }, type: QueryTypes.UPDATE });

        res.status(200).json({ success: true, revoked: true, message: 'Access revoked successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateDocumentMetadata = async (req, res) => {
    try {
        const { document_id } = req.params;
        const { document_name, document_type, tags, notes } = req.body;
        const userId = req.user.id;

        const [doc] = await sequelize.query('SELECT * FROM documents WHERE document_id = :document_id AND user_id = :userId', { replacements: { document_id, userId }, type: QueryTypes.SELECT });
        if (!doc) return res.status(403).json({ success: false, message: 'Unauthorized' });

        await sequelize.query(`
            UPDATE documents 
            SET document_name = COALESCE(:document_name, document_name),
                document_type = COALESCE(:document_type, document_type),
                tags = COALESCE(:tags, tags),
                notes = COALESCE(:notes, notes)
            WHERE document_id = :document_id
        `, { replacements: { document_id, document_name, document_type, tags, notes }, type: QueryTypes.UPDATE });

        res.status(200).json({ success: true, message: 'Document metadata updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error updating document' });
    }
};

exports.uploadNewVersion = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { document_id } = req.params;
        const userId = req.user.id;

        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        const [doc] = await sequelize.query('SELECT * FROM documents WHERE document_id = :document_id AND user_id = :userId', { replacements: { document_id, userId }, type: QueryTypes.SELECT, transaction: t });
        if (!doc) {
            await t.rollback();
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const [latestVersion] = await sequelize.query('SELECT version_number FROM document_versions WHERE document_id = :document_id ORDER BY version_number DESC LIMIT 1', { replacements: { document_id }, type: QueryTypes.SELECT, transaction: t });
        const newVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

        const version_id = uuidv4();
        const relativeStoragePath = `uploads/documents/${userId}/${req.file.filename}`;
        const fileHash = generateFileHash(req.file.path);

        await sequelize.query(`
            INSERT INTO document_versions (version_id, document_id, version_number, storage_path, file_hash, file_size_bytes, uploaded_by)
            VALUES (:version_id, :document_id, :version_number, :storage_path, :file_hash, :file_size, :userId)
        `, {
            replacements: { version_id, document_id, version_number: newVersionNumber, storage_path: relativeStoragePath, file_hash: fileHash, file_size: req.file.size, userId },
            type: QueryTypes.INSERT,
            transaction: t
        });

        await t.commit();
        res.status(201).json({ success: true, version_id, version_number: newVersionNumber, message: 'New version uploaded' });
    } catch (err) {
        await t.rollback();
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getDocumentVersions = async (req, res) => {
    try {
        const { document_id } = req.params;
        const userId = req.user.id;

        const [doc] = await sequelize.query('SELECT * FROM documents WHERE document_id = :document_id AND user_id = :userId', { replacements: { document_id, userId }, type: QueryTypes.SELECT });
        if (!doc) return res.status(403).json({ success: false, message: 'Unauthorized' });

        const versions = await sequelize.query('SELECT version_id, version_number, file_size_bytes, created_at, file_hash FROM document_versions WHERE document_id = :document_id ORDER BY version_number DESC', { replacements: { document_id }, type: QueryTypes.SELECT });

        res.status(200).json({ success: true, versions });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error retrieving versions' });
    }
};
