const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');  // ← FIXED: import admin with destructuring
const { 
  askAI, 
  getPlanRecommendation, 
  explainPlan,
  getHistory,
  getAnalytics
} = require('../controllers/aiController');

// Debug logging (optional - remove after confirming it works)
console.log('✅ AI Routes loaded');
console.log('📊 admin middleware type:', typeof admin);
console.log('📊 getAnalytics type:', typeof getAnalytics);

// All routes require authentication
router.use(protect);

// User routes
router.post('/chat', askAI);
router.post('/recommend', getPlanRecommendation);
router.post('/explain/:planId', explainPlan);
router.get('/history', getHistory);

// Admin routes
router.get('/analytics', admin, getAnalytics);

module.exports = router;