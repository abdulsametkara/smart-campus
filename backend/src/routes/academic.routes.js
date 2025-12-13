const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academic.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const academicSchema = require('../validators/academic.schema');

// Public routes (no auth required)
// Get all courses
router.get('/courses', validate(academicSchema.getCourses), academicController.getAllCourses);

// Get course by ID (public)
router.get('/courses/:id', validate(academicSchema.getCourseById), academicController.getCourseById);

// Get all course sections (with filtering and pagination)
router.get('/sections', validate(academicSchema.getSections), academicController.getAllSections);

// Get section by ID (public)
router.get('/sections/:id', validate(academicSchema.getSectionById), academicController.getSectionById);

// Protected routes
// Create course (Admin only)
router.post('/courses', authenticate, authorize('admin'), validate(academicSchema.createCourse), academicController.createCourse);

// Update course (Admin only)
router.put('/courses/:id', authenticate, authorize('admin'), validate(academicSchema.updateCourse), academicController.updateCourse);

// Delete course (Admin only)
router.delete('/courses/:id', authenticate, authorize('admin'), validate(academicSchema.deleteCourse), academicController.deleteCourse);

// Create section (Admin or Faculty)
router.post('/sections', authenticate, authorize('admin', 'faculty'), validate(academicSchema.createSection), academicController.createSection);

// Update section (Admin or Faculty - own sections)
router.put('/sections/:id', authenticate, authorize('admin', 'faculty'), validate(academicSchema.updateSection), academicController.updateSection);

// Delete section (Admin only)
router.delete('/sections/:id', authenticate, authorize('admin'), validate(academicSchema.deleteSection), academicController.deleteSection);

// Admin-only routes
router.use(authenticate, authorize('admin'));

// Assign instructor to section
router.put('/sections/:sectionId/instructor', academicController.assignInstructor);

// Enroll student to section (Admin can manually enroll)
router.post('/sections/:sectionId/enroll', academicController.enrollStudent);

// Get students of a section
router.get('/sections/:sectionId/students', academicController.getSectionStudents);

// ==================== ENROLLMENT ROUTES ====================
// Enroll to section (Student)
router.post('/enrollments', authenticate, authorize('student'), validate(academicSchema.enrollToSection), academicController.enrollToSection);

// Get my enrollments (Student)
router.get('/enrollments/my-enrollments', authenticate, authorize('student'), validate(academicSchema.getMyEnrollments), academicController.getMyEnrollments);

// Drop enrollment (Student)
router.delete('/enrollments/:id', authenticate, authorize('student'), validate(academicSchema.dropEnrollment), academicController.dropEnrollment);

module.exports = router;
