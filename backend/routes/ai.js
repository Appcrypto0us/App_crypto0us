const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');  // ← CHANGE: import protect
const admin = require('../middleware/admin');
const { 
  askAI, 
  getPlanRecommendation, 
  explainPlan,
  getHistory,
  getAnalytics
} = require('../controllers/aiController');

// All routes require authentication
router.use(protect);  // ← CHANGE: use protect instead of auth

// User routes
router.post('/chat', askAI);
router.post('/recommend', getPlanRecommendation);
router.post('/explain/:planId', explainPlan);
router.get('/history', getHistory);

// Admin routes
router.get('/analytics', admin, getAnalytics);

module.exports = router;