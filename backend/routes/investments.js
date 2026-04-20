const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const investmentController = require('../controllers/investmentController');

router.get('/', protect, investmentController.getUserInvestments);
router.post('/', protect, investmentController.createInvestment);
router.get('/plans', protect, investmentController.getInvestmentPlans);

module.exports = router;
