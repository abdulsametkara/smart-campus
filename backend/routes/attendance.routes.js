const express = require('express');
const router = express.Router();
const attendanceController = require('../src/controllers/attendance.controller');
const { authenticate, authorize } = require('../src/middleware/auth'); // Corrected path and export name

// Faculty Routes
router.post('/sessions', authenticate, authorize('faculty', 'admin'), attendanceController.createSession);
router.get('/sessions/active', authenticate, authorize('faculty', 'admin'), attendanceController.getActiveSession);
router.get('/sessions/:sessionId/report', authenticate, authorize('faculty', 'admin'), attendanceController.getSessionReport);
router.post('/sessions/:sessionId/end', authenticate, authorize('faculty', 'admin'), attendanceController.endSession);

// Student Routes
router.post('/checkin', authenticate, authorize('student'), attendanceController.checkIn);
router.get('/my-attendance', authenticate, authorize('student'), attendanceController.getMyAttendance);

module.exports = router;
