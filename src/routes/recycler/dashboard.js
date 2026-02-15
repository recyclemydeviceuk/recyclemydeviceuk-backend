// Recycler dashboard routes
const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRecentOrders,
  getRevenueChart,
  getTopDevices,
  getPerformanceMetrics,
} = require('../../controllers/recycler/dashboardController');
const { protect, recyclerOnly } = require('../../middlewares/authMiddleware');

// All routes require authentication and recycler role
router.use(protect, recyclerOnly);

// Dashboard routes
router.get('/stats', getDashboardStats);
router.get('/recent-orders', getRecentOrders);
router.get('/revenue-chart', getRevenueChart);
router.get('/top-devices', getTopDevices);
router.get('/performance-metrics', getPerformanceMetrics);

module.exports = router;
