const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middleware/auth');

// All analytics routes are protected and restricted to Admin (and maybe Faculty)
router.use(authenticate);
router.use(authorize('admin', 'faculty')); // Faculty might need some stats too

router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/academic-performance', analyticsController.getAcademicPerformance);
router.get('/attendance', analyticsController.getAttendanceAnalytics);
router.get('/meal-usage', analyticsController.getMealUsage);
router.get('/events', analyticsController.getEventsAnalytics);
router.get('/export/:type', analyticsController.exportReport);

module.exports = router;
