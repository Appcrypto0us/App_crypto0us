const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const adminController = require('../controllers/adminController');

// All routes require admin access
router.use(protect, admin);

// ============================================================================
// DASHBOARD STATS
// ============================================================================
router.get('/stats', adminController.getStats);

// ============================================================================
// USERS
// ============================================================================
router.get('/users', adminController.getUsers);
router.put('/users/:userId/ban', adminController.banUser);
router.put('/users/:userId/unban', adminController.unbanUser);
router.put('/users/:userId/balance', adminController.editBalance);
router.put('/users/:userId/referral-eligibility', adminController.updateReferralEligibility);

// ============================================================================
// DEPOSITS
// ============================================================================
router.get('/deposits/pending', adminController.getPendingDeposits);
router.put('/deposits/:depositId/approve', adminController.approveDeposit);
router.put('/deposits/:depositId/reject', adminController.rejectDeposit);

// ============================================================================
// WITHDRAWALS
// ============================================================================
router.get('/withdrawals/pending', adminController.getPendingWithdrawals);
router.put('/withdrawals/:withdrawalId/approve', adminController.approveWithdrawal);
router.put('/withdrawals/:withdrawalId/reject', adminController.rejectWithdrawal);

// ============================================================================
// KYC
// ============================================================================
router.get('/kyc/pending', adminController.getPendingKYC);
router.put('/kyc/:kycId/approve', adminController.approveKYC);
router.put('/kyc/:kycId/reject', adminController.rejectKYC);

// ============================================================================
// INVESTMENTS
// ============================================================================
router.get('/investments', adminController.getAllInvestments);
router.get('/investments/active', adminController.getActiveInvestments);
router.get('/investments/completed', adminController.getCompletedInvestments);

// ============================================================================
// TRANSACTIONS
// ============================================================================
router.get('/transactions', adminController.getAllTransactions);
router.get('/transactions/user/:userId', adminController.getUserTransactions);

// ============================================================================
// BROADCAST
// ============================================================================
router.post('/broadcast', adminController.broadcastMessage);

// ============================================================================
// SYSTEM CONFIG
// ============================================================================
router.get('/config', adminController.getSystemConfig);
router.put('/config', adminController.updateSystemConfig);

// ============================================================================
// FRAUD MANAGEMENT (NEW)
// ============================================================================
// Fraud logs
router.get('/fraud/logs', adminController.getFraudLogs);
router.get('/fraud/logs/:userId', adminController.getUserFraudHistory);
router.get('/fraud/stats', adminController.getFraudStats);

// Block management
router.get('/fraud/blocked-ips', adminController.getBlockedIPs);
router.post('/fraud/block-ip', adminController.blockIP);
router.delete('/fraud/block-ip/:ipId', adminController.unblockIP);

router.get('/fraud/blocked-fingerprints', adminController.getBlockedFingerprints);
router.post('/fraud/block-fingerprint', adminController.blockFingerprint);
router.delete('/fraud/block-fingerprint/:fingerprintId', adminController.unblockFingerprint);

// Device tracking
router.get('/fraud/devices/:userId', adminController.getUserDevices);
router.get('/fraud/accounts-by-ip/:ip', adminController.getAccountsByIP);
router.get('/fraud/accounts-by-fingerprint/:fingerprint', adminController.getAccountsByFingerprint);

// Fraud actions
router.post('/fraud/flag-user/:userId', adminController.flagUserForFraud);
router.post('/fraud/clear-flags/:userId', adminController.clearFraudFlags);
router.put('/fraud/update-score/:userId', adminController.updateFraudScore);

module.exports = router;