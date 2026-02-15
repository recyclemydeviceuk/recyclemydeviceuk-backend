// Admin metrics routes
const express = require('express');
const router = express.Router();
const {
  getPlatformMetrics,
  getRecyclerMetrics,
  getOrderTrends,
  getDeviceMetrics,
  getCustomerMetrics,
} = require('../../controllers/admin/metricsController');
const { protect, adminOnly } = require('../../middlewares/authMiddleware');

// All routes require authentication and admin role
router.use(protect, adminOnly);

// Metrics routes
router.get('/platform', getPlatformMetrics);
router.get('/recyclers', getRecyclerMetrics);
router.get('/orders/trends', getOrderTrends);
router.get('/devices', getDeviceMetrics);
router.get('/customers', getCustomerMetrics);

module.exports = router;
