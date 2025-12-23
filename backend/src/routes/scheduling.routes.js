const express = require('express');
const router = express.Router();
const schedulingController = require('../controllers/scheduling.controller');
const { authorize } = require('../middleware/auth');

// POST /api/v1/scheduling/generate - Trigger Schedule Generation (Admin only)
router.post('/generate', authorize(['admin']), schedulingController.triggerScheduling);

// GET /api/v1/scheduling/ - Get Schedule (Authenticated users)
router.get('/', authorize(), schedulingController.getSchedule);

// GET /api/v1/scheduling/export/ical - Export iCal (Authenticated users)
router.get('/export/ical', authorize(), schedulingController.exportICal);

module.exports = router;
