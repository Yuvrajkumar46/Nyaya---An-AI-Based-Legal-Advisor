const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const sequelize = require('../config/db');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');

const { QueryTypes } = require('sequelize');

// ─── REGISTER ─────────────────────────────────────────────────────────────────
const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, password, role, fullName, email, phone } = req.body;

    try {
        // Check if username already exists
        const existing = await sequelize.query(
            'SELECT id FROM users WHERE username = :username',
            { replacements: { username: username.toLowerCase() }, type: QueryTypes.SELECT }
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Username already taken. Please choose another.',
            });
        }

        // Hash password (salt rounds = 12 for production)
        const passwordHash = await bcrypt.hash(password, 12);
        
        const { v4: uuidv4 } = require('uuid');
        const user_id = uuidv4();
        const roleLower = (role || 'user').toLowerCase();

        // Insert new user
        const result = await sequelize.query(
            `INSERT INTO users (user_id, username, password_hash, role, full_name, email, phone)
       VALUES (:user_id, :username, :passwordHash, :role, :fullName, :email, :phone)`,
            { replacements: { user_id, username: username.toLowerCase(), passwordHash, role: roleLower, fullName, email, phone }, type: QueryTypes.INSERT }
        );

        const newUserId = result[0];

        // Fetch inserted user based on new ID to construct return body (Since MySQL insert returns format changed from returning feature in PG)

        const returnUserCheck = await sequelize.query(
            'SELECT id, username, role, created_at FROM users WHERE id = :id',
            { replacements: { id: newUserId }, type: QueryTypes.SELECT }
        );

        const newUser = returnUserCheck[0];

        return res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            user: {
                id: newUser.id,
                username: newUser.username,
                role: newUser.role,
                createdAt: newUser.created_at,
            },
        });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
    const { username, password } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.headers['user-agent'] || '';

    try {
        const result = await sequelize.query(
            'SELECT id, username, password_hash, role, is_active, is_deleted FROM users WHERE username = :username',
            { replacements: { username: username.toLowerCase() }, type: QueryTypes.SELECT }
        );

        if (result.length === 0) {
            await sequelize.query(
                `INSERT INTO login_audit_log (username_attempted, status, failure_reason, ip_address, user_agent) 
                 VALUES (:username, 'failed', 'user_not_found', :ip, :ua)`,
                { replacements: { username, ip: ip_address, ua: user_agent }, type: QueryTypes.INSERT }
            );
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const user = result[0];

        if (user.is_deleted) {
            await sequelize.query(
                `INSERT INTO login_audit_log (username_attempted, status, failure_reason, ip_address, user_agent) 
                 VALUES (:username, 'failed', 'user_not_found', :ip, :ua)`,
                { replacements: { username, ip: ip_address, ua: user_agent }, type: QueryTypes.INSERT }
            );
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            await sequelize.query(
                `INSERT INTO login_audit_log (user_id, username_attempted, status, failure_reason, ip_address, user_agent) 
                 VALUES (:userId, :username, 'failed', 'wrong_password', :ip, :ua)`,
                { replacements: { userId: user.id, username, ip: ip_address, ua: user_agent }, type: QueryTypes.INSERT }
            );
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        if (!user.is_active) {
            await sequelize.query(
                `INSERT INTO login_audit_log (user_id, username_attempted, status, failure_reason, ip_address, user_agent) 
                 VALUES (:userId, :username, 'blocked', 'account_suspended', :ip, :ua)`,
                { replacements: { userId: user.id, username, ip: ip_address, ua: user_agent }, type: QueryTypes.INSERT }
            );
            return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact support.' });
        }

        // Success - update last_login_at
        await sequelize.query(
            'UPDATE users SET last_login_at = NOW() WHERE id = :id',
            { replacements: { id: user.id }, type: QueryTypes.UPDATE }
        );

        // Success - insert audit log
        await sequelize.query(
            `INSERT INTO login_audit_log (user_id, username_attempted, status, ip_address, user_agent) 
             VALUES (:userId, :username, 'success', :ip, :ua)`,
            { replacements: { userId: user.id, username, ip: ip_address, ua: user_agent }, type: QueryTypes.INSERT }
        );

        const payload = { id: user.id, username: user.username, role: user.role };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // Store refresh token in db
        await sequelize.query(
            `INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at)
             VALUES (:userId, :token, :deviceInfo, :ip, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
            { replacements: { userId: user.id, token: refreshToken, deviceInfo: user_agent, ip: ip_address }, type: QueryTypes.INSERT }
        );

        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                isVerified: true,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
    const { refreshToken: token } = req.body;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Refresh token required.' });
    }

    try {
        const decoded = verifyRefreshToken(token);

        // Verify token matches stored token in DB
        const result = await sequelize.query(
            'SELECT users.id, users.username, users.role, refresh_tokens.token FROM refresh_tokens JOIN users on refresh_tokens.user_id = users.id WHERE users.id = :id AND refresh_tokens.token = :token',
            { replacements: { id: decoded.id, token: token }, type: QueryTypes.SELECT }
        );

        if (result.length === 0) {
            return res.status(403).json({ success: false, message: 'Invalid refresh token.' });
        }

        const user = result[0];
        const payload = { id: user.id, username: user.username, role: user.role };
        const newAccessToken = generateAccessToken(payload);

        return res.status(200).json({ success: true, accessToken: newAccessToken });
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid or expired refresh token.' });
    }
};

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
    try {
        const { id } = req.user;
        const { refreshToken: token } = req.body;
        await sequelize.query('DELETE FROM refresh_tokens WHERE user_id = :userId AND token = :token', { replacements: { userId: id, token: token }, type: QueryTypes.DELETE });
        return res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
    try {
        const result = await sequelize.query(
            'SELECT id, user_id as uuid, username, email, full_name, phone, role, is_active, wallet_balance, preferred_language, avatar_url, last_login_at, created_at, updated_at FROM users WHERE id = :id',
            { replacements: { id: req.user.id }, type: QueryTypes.SELECT }
        );

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const user = result[0];
        user.wallet_balance = parseFloat(user.wallet_balance) || 0;

        return res.status(200).json({ success: true, user });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ─── UPDATE PROFILE ──────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
    const { id } = req.user;
    const { fullName, phone, preferredLanguage, avatarUrl } = req.body;

    try {
        await sequelize.query(
            `UPDATE users SET 
                full_name = :fullName,
                phone = :phone,
                preferred_language = :preferredLanguage,
                avatar_url = :avatarUrl
             WHERE id = :id`,
            {
                replacements: {
                    fullName,
                    phone,
                    preferredLanguage: preferredLanguage || 'en',
                    avatarUrl: avatarUrl || null,
                    id
                },
                type: QueryTypes.UPDATE
            }
        );

        return res.status(200).json({ success: true, message: 'Profile updated successfully.' });
    } catch (err) {
        console.error('Update profile error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ─── VALIDATION RULES ─────────────────────────────────────────────────────────
const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3–30 characters.')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores.'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Valid email is required.'),
    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('Full name is required.'),
    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required.'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters.'),
    body('role')
        .optional()
        .isIn(['USER', 'ADVOCATE'])
        .withMessage('Role must be USER or ADVOCATE.'),
];

const loginValidation = [
    body('username').trim().notEmpty().withMessage('Username is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
];

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    getMe,
    updateProfile,
    registerValidation,
    loginValidation,
};
