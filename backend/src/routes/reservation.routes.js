const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/classroomReservation.controller');
const { authenticate, authorize } = require('../middleware/auth');

// POST /api/v1/reservations/ - Create new reservation (Authenticated users)
router.post('/', authenticate, reservationController.createReservation);

// GET /api/v1/reservations/ - List reservations (Authenticated users)
router.get('/', authenticate, reservationController.listReservations);

// PATCH /api/v1/reservations/:id/approve - Approve/Reject (Admin only)
router.patch('/:id/approve', authenticate, authorize('admin'), reservationController.updateStatus);

module.exports = router;
