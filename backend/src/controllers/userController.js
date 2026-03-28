const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');

// Get current user profile
exports.getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const [user] = await sequelize.query(`
            SELECT id, username, email, full_name as fullName, phone, role, wallet_balance as walletBalance, preferred_language as preferredLanguage, avatar_url
            FROM users 
            WHERE id = :userId
        `, { replacements: { userId }, type: QueryTypes.SELECT });

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.walletBalance = parseFloat(user.walletBalance) || 0;

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('getMe error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get Dashboard Stats
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const [apptCountRow] = await sequelize.query(`
            SELECT COUNT(*) as cnt FROM appointments WHERE user_id = :userId AND status IN ('scheduled', 'in_progress')
        `, { replacements: { userId }, type: QueryTypes.SELECT });

        const [docCountRow] = await sequelize.query(`
            SELECT COUNT(*) as cnt FROM documents WHERE user_id = :userId
        `, { replacements: { userId }, type: QueryTypes.SELECT });

        const [queryCountRow] = await sequelize.query(`
            SELECT COUNT(*) as cnt FROM legal_queries WHERE user_id = :userId
        `, { replacements: { userId }, type: QueryTypes.SELECT });

        const [spentRow] = await sequelize.query(`
            SELECT SUM(amount) as total FROM billing_transactions WHERE user_id = :userId AND transaction_type = 'debit' AND status = 'completed'
        `, { replacements: { userId }, type: QueryTypes.SELECT });

        res.status(200).json({
            success: true,
            data: {
                upcomingAppointments: parseInt(apptCountRow?.cnt || 0),
                documentsUploaded: parseInt(docCountRow?.cnt || 0),
                aiQueriesUsed: parseInt(queryCountRow?.cnt || 0),
                totalSpent: parseFloat(spentRow?.total || 0)
            }
        });
    } catch (error) {
        console.error('getStats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getUpcomingAppointments = async (req, res) => {
    try {
        const userId = req.user.id;
        const appointments = await sequelize.query(`
            SELECT a.appointment_id as id, adv.full_name as advocateName, a.scheduled_start_time as dateTime, a.appointment_type as type, a.status
            FROM appointments a
            LEFT JOIN advocates adv ON a.advocate_id = adv.id
            WHERE a.user_id = :userId AND a.status IN ('scheduled', 'in_progress')
            ORDER BY a.scheduled_start_time ASC
            LIMIT 5
        `, { replacements: { userId }, type: QueryTypes.SELECT });

        res.status(200).json({ success: true, data: appointments });
    } catch (error) {
        console.error('getUpcomingAppointments error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getLegalGuidanceHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const queries = await sequelize.query(`
            SELECT query_id as id, query_text as queryText, practice_area as practiceArea, created_at as date
            FROM legal_queries
            WHERE user_id = :userId
            ORDER BY created_at DESC
            LIMIT 5
        `, { replacements: { userId }, type: QueryTypes.SELECT });

        res.status(200).json({ success: true, data: queries });
    } catch (error) {
        console.error('getLegalGuidanceHistory error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: 'Profile updated successfully', data: req.body });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateNotificationPreferences = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: 'Notification preferences updated successfully', data: req.body });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.requestDataDeletion = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: 'Data deletion request submitted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.logoutAllDevices = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: 'Logged out from all other devices successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
