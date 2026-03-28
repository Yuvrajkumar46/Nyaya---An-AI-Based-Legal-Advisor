const Notification = require('../models/Notification');

/**
 * Helper function to create a notification
 * @param {string} userId - User UUID
 * @param {string} type - Notification type (e.g. 'payment_success', 'appointment_confirmed')
 * @param {string} title - Short title for notification
 * @param {string} message - Detailed message
 * @param {string} [actionUrl=null] - URL to redirect to when clicked
 */
const createNotification = async (userId, type, title, message, actionUrl = null) => {
    try {
        await Notification.create({
            user_id: userId,
            type,
            title,
            message,
            action_url: actionUrl,
            is_read: false
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
        // We don't throw here to avoid failing the main action (like booking or payment)
    }
};

module.exports = { createNotification };
