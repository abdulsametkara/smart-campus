const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate); // All routes require login

router.get('/', notificationController.getNotifications);
router.put('/mark-all-read', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);



// Admin Only
router.post('/send', authorize('admin'), notificationController.sendNotification);

module.exports = router;
