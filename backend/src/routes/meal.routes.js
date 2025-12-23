const express = require('express');
const router = express.Router();
const mealController = require('../controllers/meal.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Public or Authenticated? Usually ID authentication needed to see personalized stuff, but menus could be public.
// For now, require auth for simplicity and security.
router.use(authenticate);

// Public/User routes
router.get('/menus', mealController.getWeeklyMenus);
router.post('/reservations', mealController.makeReservation);
router.get('/reservations', mealController.getMyReservations);
router.delete('/reservations/:id', mealController.cancelReservation);
router.patch('/reservations/:id/use', authorize('admin', 'staff'), mealController.markAsUsed);

// Admin routes - Menu Management
router.get('/menus/all', authorize('admin'), mealController.getAllMenus);
router.post('/menus', authorize('admin'), mealController.createMenu);
router.put('/menus/:id', authorize('admin'), mealController.updateMenu);
router.delete('/menus/:id', authorize('admin'), mealController.deleteMenu);
router.patch('/menus/:id/publish', authorize('admin'), mealController.togglePublish);

module.exports = router;
