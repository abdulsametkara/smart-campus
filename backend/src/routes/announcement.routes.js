const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcement.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('faculty', 'admin'), announcementController.createAnnouncement);
router.get('/', authenticate, announcementController.getMyAnnouncements);
router.delete('/:id', authenticate, authorize('faculty', 'admin'), announcementController.deleteAnnouncement);

module.exports = router;
