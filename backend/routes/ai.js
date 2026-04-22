const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { 
  askAI, 
  getPlanRecommendation, 
  explainPlan,
  getHistory,
  getAnalytics
} = require('../controllers/aiController');

// All routes require authentication
router.use(auth);

// User routes
router.post('/chat', askAI);
router.post('/recommend', getPlanRecommendation);
router.post('/explain/:planId', explainPlan);
router.get('/history', getHistory);

// Admin routes
router.get('/analytics', admin, getAnalytics);

module.exports = router;