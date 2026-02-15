// Admin dashboard routes
const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRecentActivity,
  getRevenueAnalytics,
} = require('../../controllers/admin/dashboardController');
const { protect, adminOnly } = require('../../middlewares/authMiddleware');

// All routes require authentication and admin role
router.use(protect, adminOnly);

// Dashboard routes
router.get('/stats', getDashboardStats);
router.get('/recent-activity', getRecentActivity);
router.get('/revenue-analytics', getRevenueAnalytics);

module.exports = router;
