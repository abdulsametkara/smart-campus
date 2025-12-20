const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/classroomReservation.controller');
// Add Auth middleware if needed, e.g.: const { authenticate, authorize } = require('../middleware/auth');
// For now, assuming open or placeholder

// POST /api/v1/reservations/ - Create new reservation
router.post('/', reservationController.createReservation);

// GET /api/v1/reservations/ - List reservations
router.get('/', reservationController.listReservations);

// PATCH /api/v1/reservations/:id/approve - Approve/Reject (Admin)
// router.patch('/:id/approve', authenticate, authorize('admin', 'academic_admin'), reservationController.updateStatus);
// For simplicity in this step without auth middleware setup knowledge:
router.patch('/:id/approve', reservationController.updateStatus);

module.exports = router;
