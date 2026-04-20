const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const depositController = require('../controllers/depositController');

router.get('/pending', protect, depositController.getPendingDeposits);
router.post('/', protect, depositController.createDeposit);
router.get('/instructions', protect, depositController.getDepositInstructions);

module.exports = router;
