const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const registrationController = require('../controllers/registration.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes - Get events (filtered by status)
router.get('/', eventController.getAllEvents);

// User's registrations - must be before /:id route to avoid conflict
router.get('/my/registrations', authenticate, registrationController.getMyRegistrations);

// Event by ID - must be after specific routes
router.get('/:id', eventController.getEventById);

// Protected routes - Event management (Admin/Event Manager)
router.post('/', authenticate, authorize('admin'), eventController.createEvent);
router.put('/:id', authenticate, authorize('admin'), eventController.updateEvent);
router.delete('/:id', authenticate, authorize('admin'), eventController.deleteEvent);

// Registration routes
router.post('/:id/register', authenticate, registrationController.registerToEvent);
router.delete('/:eventId/registrations/:regId', authenticate, registrationController.cancelRegistration);
router.get('/:id/registrations', authenticate, authorize('admin'), registrationController.getEventRegistrations);
router.post('/:eventId/registrations/:regId/checkin', authenticate, authorize('admin'), registrationController.checkInUser);

module.exports = router;

