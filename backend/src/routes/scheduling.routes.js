const express = require('express');
const router = express.Router();
const schedulingController = require('../controllers/scheduling.controller');
const { authenticate, authorize } = require('../middleware/auth');

// POST /api/v1/scheduling/generate - Trigger Schedule Generation (Admin only)
router.post('/generate', authenticate, authorize('admin'), schedulingController.triggerScheduling);

// GET /api/v1/scheduling/ - Get Schedule (Authenticated users)
router.get('/', authenticate, authorize(), schedulingController.getSchedule);

// GET /api/v1/scheduling/export/ical - Export iCal (Authenticated users)
router.get('/export/ical', authenticate, authorize(), schedulingController.exportICal);

module.exports = router;
