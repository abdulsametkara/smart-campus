const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const cardController = require('../controllers/card.controller');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Wallet routes
router.get('/', walletController.getMyWallet);
router.post('/top-up', walletController.topUp);
router.get('/history', walletController.getHistory);

// Saved cards routes
router.get('/cards', cardController.getSavedCards);
router.post('/cards', cardController.saveCard);
router.delete('/cards/:id', cardController.deleteCard);
router.patch('/cards/:id/default', cardController.setDefaultCard);

module.exports = router;
