import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://app-crypto0us.onrender.com/api',
  // ⚠️ DO NOT set Content-Type globally - let axios/browser set it per request
  // headers: {
  //   'Content-Type': 'application/json',  // ← REMOVE THIS LINE
  // },
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Only set Content-Type to application/json if not FormData
    // For FormData, let the browser set it automatically with boundary
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Use navigate or window.location
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// AI CHAT ENDPOINTS
// ============================================================================

/**
 * Send a message to the AI assistant
 * @param {string} message - User's message
 * @param {string} sessionId - Optional session ID for conversation continuity
 * @returns {Promise} - AI response with sessionId
 */
API.chatWithAI = (message, sessionId = null) => {
  return API.post('/ai/chat', { message, sessionId });
};

/**
 * Get AI interaction history for the current user
 * @param {number} limit - Number of interactions to return (default: 50)
 * @param {number} offset - Pagination offset (default: 0)
 * @returns {Promise} - List of past AI interactions
 */
API.getAIHistory = (limit = 50, offset = 0) => {
  return API.get('/ai/history', { params: { limit, offset } });
};

/**
 * Get AI-powered investment plan recommendation
 * @param {number} amount - Investment amount in USD
 * @param {string} goal - User's investment goal (optional)
 * @returns {Promise} - AI recommendation response
 */
API.getAIRecommendation = (amount, goal = null) => {
  return API.post('/ai/recommend', { amount, goal });
};

/**
 * Get AI explanation of a specific investment plan
 * @param {string} planId - Plan identifier (e.g., 'basic_plan', 'gold_plan')
 * @returns {Promise} - AI explanation of the plan
 */
API.explainPlanWithAI = (planId) => {
  return API.post(`/ai/explain/${planId}`);
};

/**
 * Get AI analytics (admin only)
 * @param {string} startDate - Optional start date filter
 * @param {string} endDate - Optional end date filter
 * @returns {Promise} - AI usage analytics
 */
API.getAIAnalytics = (startDate = null, endDate = null) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return API.get('/ai/analytics', { params });
};

// ============================================================================
// AI CHAT ENDPOINTS (Alternative export style)
// ============================================================================
export const aiAPI = {
  // Send message to AI assistant
  chat: (message, sessionId = null) => API.post('/ai/chat', { message, sessionId }),

  // Get chat history
  getHistory: (limit = 50, offset = 0) => API.get('/ai/history', { params: { limit, offset } }),

  // Get investment recommendation
  recommend: (amount, goal) => API.post('/ai/recommend', { amount, goal }),

  // Explain plan details
  explainPlan: (planId) => API.post(`/ai/explain/${planId}`),

  // Get analytics (admin only)
  getAnalytics: (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return API.get('/ai/analytics', { params });
  }
};

export default API;