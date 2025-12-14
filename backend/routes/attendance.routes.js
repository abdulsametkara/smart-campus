const express = require('express');
const router = express.Router();
const attendanceController = require('../src/controllers/attendance.controller');
const { authenticate, authorize } = require('../src/middleware/auth');

// Faculty Routes
router.post('/sessions', authenticate, authorize('faculty', 'admin'), attendanceController.createSession);
router.get('/sessions/active', authenticate, authorize('faculty', 'admin'), attendanceController.getActiveSession);
router.get('/sessions/my', authenticate, authorize('faculty', 'admin'), attendanceController.getMySessionsHistory);
router.get('/sessions/:sessionId', authenticate, authorize('faculty', 'admin', 'student'), attendanceController.getSessionById);
router.get('/sessions/:sessionId/report', authenticate, authorize('faculty', 'admin'), attendanceController.getSessionReport);
router.post('/sessions/:sessionId/end', authenticate, authorize('faculty', 'admin'), attendanceController.endSession);
router.get('/sections/my', authenticate, authorize('faculty', 'admin'), attendanceController.getMySections);
router.get('/sections/:sectionId/summary', authenticate, authorize('faculty', 'admin'), attendanceController.getSectionSummary);
router.get('/sections/:sectionId/history', authenticate, authorize('faculty', 'admin'), attendanceController.getSessionHistory);

// Student Routes
router.post('/checkin', authenticate, authorize('student'), attendanceController.checkIn);
router.get('/my-attendance', authenticate, authorize('student'), attendanceController.getMyAttendance);
router.get('/my-absences', authenticate, authorize('student'), attendanceController.getMyAbsences);
router.get('/my-history', authenticate, authorize('student'), attendanceController.getMyAttendanceHistory);

module.exports = router;

