const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { antiFraudMiddleware } = require('../middleware/antiFraud');

// ============================================================================
// REGISTER (with anti-fraud middleware)
// ============================================================================
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').notEmpty().withMessage('Phone number required'),
  body('first_name').notEmpty().withMessage('First name required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('pin').isLength({ min: 4, max: 6 }).withMessage('PIN must be 4-6 digits'),
  body('referral_code').optional(),
], antiFraudMiddleware, authController.register);

// ============================================================================
// VERIFY OTP
// ============================================================================
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
], authController.verifyOTP);

// ============================================================================
// LOGIN
// ============================================================================
router.post('/login', [
  body('phone').notEmpty().withMessage('Phone number required'),
  body('pin').notEmpty().withMessage('PIN required'),
], authController.login);

// ============================================================================
// GET CURRENT USER
// ============================================================================
router.get('/me', protect, authController.getMe);

// ============================================================================
// RESEND OTP
// ============================================================================
router.post('/resend-otp', [
  body('email').isEmail().normalizeEmail(),
], authController.resendOTP);

module.exports = router;