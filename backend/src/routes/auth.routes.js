const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const authSchema = require('../validators/auth.schema');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', validate(authSchema.register), authController.register);
router.post('/login', validate(authSchema.login), authController.login);
router.post('/refresh', validate(authSchema.refresh), authController.refresh);
router.post('/verify-email', validate(authSchema.verifyEmail), authController.verifyEmail);
router.post('/forgot-password', validate(authSchema.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(authSchema.resetPassword), authController.resetPassword);
router.post('/logout', validate(authSchema.logout), authController.logout);
router.post('/resend-verification', authController.resendVerification);

// 2FA Routes
router.get('/2fa/setup', authenticate, authController.setup2FA);
router.post('/2fa/verify', authenticate, authController.verify2FASetup);
router.post('/2fa/disable', authenticate, authController.disable2FA);
router.post('/2fa/login', authController.verify2FALogin);

module.exports = router;
