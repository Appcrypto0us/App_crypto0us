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

// Add these methods to your existing API object

// AI Chat endpoints
export const aiAPI = {
  // Send message to AI assistant
  chat: (message) => API.post('/ai/chat', { message }),
  
  // Get investment recommendation
  recommend: (amount, goal) => API.post('/ai/recommend', { amount, goal }),
  
  // Explain plan details
  explainPlan: (planId) => API.post(`/ai/explain/${planId}`),
};
export default API;
