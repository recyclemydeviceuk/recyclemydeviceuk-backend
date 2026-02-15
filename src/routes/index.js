// Main routes index - Central routing configuration
const express = require('express');
const router = express.Router();

// Import authentication routes
const adminAuthRoutes = require('./auth/adminAuth');
const recyclerAuthRoutes = require('./auth/recyclerAuth');

// Import admin routes
const adminContactRoutes = require('./admin/contact');
const adminContentRoutes = require('./admin/content');
const adminDashboardRoutes = require('./admin/dashboard');
const adminDeviceRoutes = require('./admin/devices');
const adminMetricsRoutes = require('./admin/metrics');
const adminOrderRoutes = require('./admin/orders');
const adminRecyclerRoutes = require('./admin/recyclers');
const adminReviewRoutes = require('./admin/reviews');
const adminUtilitiesRoutes = require('./admin/utilities');

// Import customer routes
const customerBlogRoutes = require('./customer/blog');
const customerContactRoutes = require('./customer/contact');
const customerDeviceRoutes = require('./customer/devices');
const customerFaqRoutes = require('./customer/faq');
const customerOrderRoutes = require('./customer/orders');
const customerPricingRoutes = require('./customer/pricing');
const customerRecyclerApplicationRoutes = require('./customer/recyclerApplication');
const customerReviewRoutes = require('./customer/reviews');

// Import recycler routes
const recyclerDashboardRoutes = require('./recycler/dashboard');
const recyclerDeviceRoutes = require('./recycler/devices');
const recyclerOrderRoutes = require('./recycler/orders');
const recyclerProfileRoutes = require('./recycler/profile');
const recyclerReviewRoutes = require('./recycler/reviews');

// Authentication routes
router.use('/auth/admin', adminAuthRoutes);
router.use('/auth/recycler', recyclerAuthRoutes);

// Admin routes
router.use('/admin/contacts', adminContactRoutes);
router.use('/admin/content', adminContentRoutes);
router.use('/admin/dashboard', adminDashboardRoutes);
router.use('/admin/devices', adminDeviceRoutes);
router.use('/admin/metrics', adminMetricsRoutes);
router.use('/admin/orders', adminOrderRoutes);
router.use('/admin/recyclers', adminRecyclerRoutes);
router.use('/admin/reviews', adminReviewRoutes);
router.use('/admin/utilities', adminUtilitiesRoutes);

// Customer routes (public)
router.use('/customer/blogs', customerBlogRoutes);
router.use('/customer/contact', customerContactRoutes);
router.use('/customer/devices', customerDeviceRoutes);
router.use('/customer/faqs', customerFaqRoutes);
router.use('/customer/orders', customerOrderRoutes);
router.use('/customer/pricing', customerPricingRoutes);
router.use('/customer/recycler-applications', customerRecyclerApplicationRoutes);
router.use('/customer/reviews', customerReviewRoutes);

// Recycler routes (protected)
router.use('/recycler/dashboard', recyclerDashboardRoutes);
router.use('/recycler/devices', recyclerDeviceRoutes);
router.use('/recycler/orders', recyclerOrderRoutes);
router.use('/recycler/profile', recyclerProfileRoutes);
router.use('/recycler/reviews', recyclerReviewRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

module.exports = router;
