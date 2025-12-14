const express = require('express');
const router = express.Router();
const excuseController = require('../controllers/excuse.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { excuseUpload } = require('../middleware/upload.middleware');

// Student Routes
router.post('/', authenticate, authorize('student'), excuseUpload.single('document'), excuseController.createExcuse);
router.get('/my', authenticate, authorize('student'), excuseController.getMyExcuses);

// Faculty Routes
router.get('/pending', authenticate, authorize('faculty', 'admin'), excuseController.getPendingExcuses);
router.put('/:excuseId/approve', authenticate, authorize('faculty', 'admin'), excuseController.approveExcuse);
router.put('/:excuseId/reject', authenticate, authorize('faculty', 'admin'), excuseController.rejectExcuse);

module.exports = router;
