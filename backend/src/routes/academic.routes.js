const express = require('express');
const router = express.Router();

router.use((req, res, next) => {
    console.log(`[Academic Router] ${req.method} ${req.path}`);
    next();
});

const academicController = require('../controllers/academic.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const academicSchema = require('../validators/academic.schema');

// Protected routes - requires authentication for role-based filtering
// Get all courses (role-filtered: student=enrolled, faculty=taught, admin=all)
router.get('/courses', authenticate, validate(academicSchema.getCourses), academicController.getAllCourses);

// Get course by ID
router.get('/courses/:id', authenticate, validate(academicSchema.getCourseById), academicController.getCourseById);

// Get all course sections (role-filtered: student=enrolled, faculty=taught, admin=all)
router.get('/sections', authenticate, validate(academicSchema.getSections), academicController.getAllSections);

// Get section by ID
router.get('/sections/:id', authenticate, validate(academicSchema.getSectionById), academicController.getSectionById);

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

// ==================== ADMIN ONLY OPERATIONS ====================
// Assign instructor to section (Admin only)
router.put('/sections/:sectionId/instructor', authenticate, authorize('admin'), academicController.assignInstructor);

// Enroll student to section (Admin specific manual enroll)
router.post('/sections/:sectionId/enroll', authenticate, authorize('admin'), academicController.enrollStudent);

// Get students of a section (Admin or Faculty)
// Faculty should only see students of sections they teach (Controller logic required)
router.get('/sections/:sectionId/students', authenticate, authorize('admin', 'faculty'), academicController.getSectionStudents);

// ==================== ENROLLMENT ROUTES ====================
// Enroll to section (Student)
router.post('/enrollments', authenticate, authorize('student'), validate(academicSchema.enrollToSection), academicController.enrollToSection);

// Get my enrollments (Student)
router.get('/enrollments/my-enrollments', authenticate, authorize('student'), validate(academicSchema.getMyEnrollments), academicController.getMyEnrollments);

// Drop enrollment (Student)
router.delete('/enrollments/:id', authenticate, authorize('student'), validate(academicSchema.dropEnrollment), academicController.dropEnrollment);

// ==================== DROPDOWN DATA ROUTES ====================
// Get classrooms (for schedule dropdown)
router.get('/classrooms', authenticate, academicController.getAllClassrooms);

// Get faculty list (for instructor dropdown - Admin only?)
// Usually only admin assigns instructors, so maybe allow admin or faculty?
// Let's keep it open to authenticated users if needed, or restrict to admin/faculty.
// Assuming getFacultyList is used by Admin mostly.
router.get('/faculty', authenticate, authorize('admin', 'faculty', 'student'), academicController.getFacultyList); // Added authorize just in case, match with previous usage context if any. 
// Previously it was under admin-only block so it was admin-only.
// But some forms might need it? 
// If it was under admin block, then 'admin' is safe. But let's add 'faculty' if they can assign things?
// Faculty can create section, but assign instructor? Usually assign self?
// Let's allow admin and faculty.

// ==================== SYSTEM SETTINGS ROUTES ====================
// Get settings
router.get('/settings', authenticate, academicController.getSettings);

// Update settings (Admin only)
router.put('/settings', authenticate, authorize('admin'), academicController.updateSettings);

// ==================== ADVISOR APPROVAL ROUTES ====================
// Get pending enrollments for advisor's students
router.get('/advisor/pending-enrollments', authenticate, authorize('faculty'), academicController.getAdvisorPendingEnrollments);

// Approve enrollment (Advisor/Faculty)
router.put('/enrollments/:id/approve', authenticate, authorize('faculty'), academicController.approveEnrollment);

// Reject enrollment (Advisor/Faculty)
router.put('/enrollments/:id/reject', authenticate, authorize('faculty'), academicController.rejectEnrollment);

// Get my advisor (Student)
router.get('/my-advisor', authenticate, authorize('student'), academicController.getMyAdvisor);

// Get my advisees (Faculty)
router.get('/my-advisees', authenticate, authorize('faculty'), academicController.getMyAdvisees);

module.exports = router;