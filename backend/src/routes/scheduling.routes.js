const express = require('express');
const router = express.Router();
const schedulingController = require('../controllers/scheduling.controller');

// POST /api/v1/scheduling/generate - Trigger Schedule Generation
router.post('/generate', schedulingController.triggerScheduling);

// GET /api/v1/scheduling/ - Get Schedule
router.get('/', schedulingController.getSchedule);

// GET /api/v1/scheduling/export/ical - Export iCal
router.get('/export/ical', schedulingController.exportICal);

module.exports = router;
