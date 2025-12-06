const express = require('express');
const {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerification,
} = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const authSchema = require('../validators/auth.schema');

const router = express.Router();

router.post('/register', validate(authSchema.register), register);
router.post('/login', validate(authSchema.login), login);
router.post('/refresh', validate(authSchema.refresh), refresh);
router.post('/verify-email', validate(authSchema.verifyEmail), verifyEmail);
router.post('/forgot-password', validate(authSchema.forgotPassword), forgotPassword);
router.post('/reset-password', validate(authSchema.resetPassword), resetPassword);
router.post('/logout', validate(authSchema.logout), logout);
router.post('/resend-verification', resendVerification);

module.exports = router;
