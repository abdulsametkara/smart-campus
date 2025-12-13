const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academic.controller');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require Admin role
router.use(authenticate, authorize('admin'));

// Get all course sections
router.get('/sections', academicController.getAllSections);

// Assign instructor to section
router.put('/sections/:sectionId/instructor', academicController.assignInstructor);

// Enroll student to section
router.post('/sections/:sectionId/enroll', academicController.enrollStudent);

// Get students of a section
router.get('/sections/:sectionId/students', academicController.getSectionStudents);

module.exports = router;
