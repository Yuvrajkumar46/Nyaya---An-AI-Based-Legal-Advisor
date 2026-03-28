const Notification = require('../models/Notification');
const { Op } = require('sequelize');

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id; // from auth middleware
        const { type, is_read, limit = 50 } = req.query;

        const whereClause = { user_id: userId };
        if (type && type !== 'All') {
            whereClause.type = type; // The frontend passes "All", "Appointments", etc. WAIT, frontend passes specific filters. I need to handle that or let frontend filter.
        }
        if (is_read !== undefined && is_read !== '') {
            whereClause.is_read = is_read === 'true';
        }

        const notifications = await Notification.findAll({
            where: whereClause,
            order: [
                ['is_read', 'ASC'], // Unread first
                ['created_at', 'DESC'] // Newest first
            ],
            limit: parseInt(limit, 10)
        });

        res.json({ success: true, count: notifications.length, data: notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await Notification.count({
            where: { user_id: userId, is_read: false }
        });
        res.json({ success: true, count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOne({ where: { notification_id: id, user_id: userId } });
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        notification.is_read = true;
        notification.read_at = new Date();
        await notification.save();

        res.json({ success: true, data: notification });
    } catch (error) {
        console.error('Error marking as read:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.update(
            { is_read: true, read_at: new Date() },
            { where: { user_id: userId, is_read: false } }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.dismissNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const deleted = await Notification.destroy({ where: { notification_id: id, user_id: userId } });
        if (deleted === 0) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.json({ success: true, message: 'Notification dismissed' });
    } catch (error) {
        console.error('Error dismissing notification:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.clearAll = async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.destroy({ where: { user_id: userId } });

        res.json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
