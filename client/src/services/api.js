// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Trade APIs
export const tradeAPI = {
  placeOrder: (orderData) => api.post('/trades/place', orderData),
  getActiveOrders: (params) => api.get('/trades/active', { params }),
  getUserBalance: () => api.get('/trades/balance'),
  getCompletedOrders: (params) => api.get('/trades/completed', { params }),
  getOrderById: (orderId) => api.get(`/trades/${orderId}`),
   
  cancelOrder: (orderId, reason) => api.post(`/trades/${orderId}/cancel`, { reason }),
  getTradingStats: () => api.get('/trades/stats/summary'),
 
  checkTradeEligibility: (amount) => api.post('/trades/check-eligibility', { amount }),
  getTradingHistory: (params) => api.get('/trades/history', { params }),
};

// Add to your existing api.js file:
export const conversionAPI = {
  getBalance: () => api.get('/conversions/balance'),
  getPrices: () => api.get('/conversions/prices'),
  calculate: (data) => api.post('/conversions/calculate', data),
  execute: (data) => api.post('/conversions/execute', {...data}),
};
/*
// User APIs
export const userAPI = {
  // Get user profile
  getProfile: () => api.get('/users/profile'),

  // Update user profile
  updateProfile: (data) => api.put('/users/profile', data),

  // Get all users (admin)
  getAllUsers: (params) => api.get('/users/admin/all', { params }),

  // Update user wallet (admin)
  updateUserWallet: (userId, data) => api.post(`/users/admin/wallet/${userId}`, data),

  // Block/unblock user (admin)
  toggleBlockUser: (userId, data) => api.post(`/users/admin/block/${userId}`, data),

  // Toggle force win (admin)
  toggleForceWin: (userId, data) => api.post(`/trades/admin/force-win/${userId}`, data),

  // Get force win users (admin)
  getForceWinUsers: (params) => api.get('/trades/admin/force-win-users', { params }),

  // Get manipulated trades (admin)
  getManipulatedTrades: (params) => api.get('/trades/admin/manipulated-trades', { params }),
};

// Admin Trade APIs
export const adminTradeAPI = {
  // Force complete order
  forceCompleteOrder: (orderId, data) => api.post(`/trades/admin/force-complete/${orderId}`, data),

  // Trigger auto-completion
  triggerAutoCompletion: () => api.post('/trades/admin/auto-complete/trigger'),

  // Get auto-completion status
  getAutoCompletionStatus: () => api.get('/trades/admin/auto-complete/status'),

  // Control auto-completion service
  controlAutoCompletion: (action) => api.post('/trades/admin/auto-complete/control', { action }),

  // Get completion statistics
  getCompletionStats: () => api.get('/trades/admin/completion-stats'),

  // Test force logic
  testForceLogic: (data) => api.post('/trades/admin/test-force-logic', data),
};

// Auth APIs
export const authAPI = {
  // Login
  login: (credentials) => api.post('/auth/login', credentials),

  // Register
  register: (userData) => api.post('/auth/register', userData),

  // Verify email
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),

  // Forgot password
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),

  // Reset password
  resetPassword: (data) => api.post('/auth/reset-password', data),

  // Get current user
  getCurrentUser: () => api.get('/auth/me'),

  // Logout
  logout: () => api.post('/auth/logout'),
};

// Wallet APIs
export const walletAPI = {
  // Deposit
  deposit: (data) => api.post('/wallet/deposit', data),

  // Withdraw
  withdraw: (data) => api.post('/wallet/withdraw', data),

  // Get transactions
  getTransactions: (params) => api.get('/wallet/transactions', { params }),

  // Get deposit methods
  getDepositMethods: () => api.get('/wallet/deposit-methods'),

  // Get withdrawal methods
  getWithdrawalMethods: () => api.get('/wallet/withdrawal-methods'),
};

// Price APIs
export const priceAPI = {
  // Get all prices
  getAllPrices: () => api.get('/prices/all'),

  // Get price history
  getPriceHistory: (coinId, params) => api.get(`/prices/${coinId}/history`, { params }),

  // Get market stats
  getMarketStats: () => api.get('/prices/market-stats'),
};

*/
export default api;