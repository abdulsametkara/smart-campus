const express = require('express');
const router = express.Router();
const gradingController = require('../controllers/grading.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Exam Management
router.post('/exams', authenticate, authorize('faculty', 'admin'), gradingController.createExam);
router.get('/exams/section/:sectionId', authenticate, gradingController.getSectionExams);
router.delete('/exams/:id', authenticate, authorize('faculty', 'admin'), gradingController.deleteExam);
router.put('/exams/:id/publish', authenticate, authorize('faculty', 'admin'), gradingController.publishExam);

// Grade Management
router.post('/grades', authenticate, authorize('faculty', 'admin'), gradingController.submitValidGrades); // Changed to submitValidGrades
router.get('/grades/exam/:examId', authenticate, authorize('faculty', 'admin'), gradingController.getExamGrades);

// Student Transcript
router.get('/my-grades', authenticate, gradingController.getMyGrades);

module.exports = router;
