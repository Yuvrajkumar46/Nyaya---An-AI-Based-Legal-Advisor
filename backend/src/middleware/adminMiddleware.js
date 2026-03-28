const jwt = require('jsonwebtoken');

/**
 * Middleware strictly for Admin routes.
 * Requires a valid JWT signed with ADMIN_JWT_SECRET.
 * Requires the payload role to be 'admin'.
 */
const authenticateAdmin = (req, res, next) => {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ success: false, message: 'No admin token, authorization denied' });
    }

    try {
        if (!process.env.ADMIN_JWT_SECRET) {
            console.error('CRITICAL: ADMIN_JWT_SECRET is not set in environment variables.');
            return res.status(500).json({ success: false, message: 'Server configuration error' });
        }

        // Verify token with ADMIN secret ONLY
        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

        // Enforce role
        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
        }

        req.admin = decoded; // Store admin info in req.admin instead of req.user
        next();
    } catch (err) {
        console.error('Admin Auth Error:', err.message);
        res.status(401).json({ success: false, message: 'Admin token is not valid' });
    }
};

/**
 * Helper utility to log actions to admin_audit_log
 */
const logAdminAction = async (pool, adminId, action, targetId = null, details = null) => {
    try {
        await pool.query(
            'INSERT INTO admin_audit_log (admin_id, action, target_id, details) VALUES (?, ?, ?, ?)',
            [adminId, action, targetId, details ? JSON.stringify(details) : null]
        );
    } catch (error) {
        console.error('Failed to write admin audit log:', error);
    }
};

module.exports = { authenticateAdmin, logAdminAction };
