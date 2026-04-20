const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const withdrawalController = require('../controllers/withdrawalController');

router.get('/pending', protect, withdrawalController.getPendingWithdrawals);
router.post('/', protect, withdrawalController.createWithdrawal);

module.exports = router;
