const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.get('/referrals', protect, userController.getReferrals);
router.get('/transactions', protect, userController.getTransactions);
router.get('/dashboard-stats', protect, userController.getDashboardStats);

module.exports = router;
