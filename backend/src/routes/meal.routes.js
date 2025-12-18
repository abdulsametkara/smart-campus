const express = require('express');
const router = express.Router();
const mealController = require('../controllers/meal.controller');
const { authenticate } = require('../middleware/auth');

// Public or Authenticated? Usually ID authentication needed to see personalized stuff, but menus could be public.
// For now, require auth for simplicity and security.
router.use(authenticate);

router.get('/menus', mealController.getWeeklyMenus);
router.post('/reservations', mealController.makeReservation);
router.get('/reservations', mealController.getMyReservations);
router.delete('/reservations/:id', mealController.cancelReservation);
router.patch('/reservations/:id/use', mealController.markAsUsed);

module.exports = router;
