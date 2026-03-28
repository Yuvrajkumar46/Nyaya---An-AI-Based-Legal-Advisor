const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/mark-all-read', notificationController.markAllAsRead);
router.delete('/clear-all', notificationController.clearAll);

router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.dismissNotification);

module.exports = router;
