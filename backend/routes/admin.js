const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const adminController = require('../controllers/adminController');

// All routes require admin access
router.use(protect, admin);

// Dashboard stats
router.get('/stats', adminController.getStats);

// Users
router.get('/users', adminController.getUsers);
router.put('/users/:userId/ban', adminController.banUser);
router.put('/users/:userId/unban', adminController.unbanUser);
router.put('/users/:userId/balance', adminController.editBalance);

// Deposits
router.get('/deposits/pending', adminController.getPendingDeposits);
router.put('/deposits/:depositId/approve', adminController.approveDeposit);
router.put('/deposits/:depositId/reject', adminController.rejectDeposit);

// Withdrawals
router.get('/withdrawals/pending', adminController.getPendingWithdrawals);
router.put('/withdrawals/:withdrawalId/approve', adminController.approveWithdrawal);
router.put('/withdrawals/:withdrawalId/reject', adminController.rejectWithdrawal);

// KYC
router.get('/kyc/pending', adminController.getPendingKYC);
router.put('/kyc/:kycId/approve', adminController.approveKYC);
router.put('/kyc/:kycId/reject', adminController.rejectKYC);

// Investments (NEW)
router.get('/investments', adminController.getAllInvestments);
router.get('/investments/active', adminController.getActiveInvestments);
router.get('/investments/completed', adminController.getCompletedInvestments);

// Transactions (NEW)
router.get('/transactions', adminController.getAllTransactions);
router.get('/transactions/user/:userId', adminController.getUserTransactions);

// Broadcast
router.post('/broadcast', adminController.broadcastMessage);

// System Config (NEW - optional)
router.get('/config', adminController.getSystemConfig);
router.put('/config', adminController.updateSystemConfig);

module.exports = router;
