const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

router.put('/password', protect, settingsController.updatePassword);
router.get('/payment-methods', protect, settingsController.getPaymentMethods);
router.put('/payment-methods', protect, settingsController.updatePaymentMethods);

module.exports = router;
