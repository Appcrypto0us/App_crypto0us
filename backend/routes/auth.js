const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').notEmpty().withMessage('Phone number required'),
  body('first_name').notEmpty().withMessage('First name required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('pin').isLength({ min: 4, max: 6 }).withMessage('PIN must be 4-6 digits'),
  body('referral_code').optional(),
], authController.register);

// Verify OTP
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
], authController.verifyOTP);

// Login
router.post('/login', [
  body('phone').notEmpty().withMessage('Phone number required'),
  body('pin').notEmpty().withMessage('PIN required'),
], authController.login);

// Get current user
router.get('/me', protect, authController.getMe);

// Resend OTP
router.post('/resend-otp', [
  body('email').isEmail().normalizeEmail(),
], authController.resendOTP);

module.exports = router;
