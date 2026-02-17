// Main routes index - Central routing configuration
const express = require('express');
const router = express.Router();
const { validateAdminSession, requireAdmin } = require('../middlewares/sessionMiddleware');

// Import authentication routes
const adminAuthRoutes = require('./auth/adminAuth');
const recyclerAuthRoutes = require('./auth/recyclerAuth');

// Import admin routes
const adminContactRoutes = require('./admin/contact');
const adminContentRoutes = require('./admin/content');
const adminCustomerRoutes = require('./admin/customers');
const adminDashboardRoutes = require('./admin/dashboard');
const adminDeviceRoutes = require('./admin/devices');
const adminMetricsRoutes = require('./admin/metrics');
const adminNewsletterRoutes = require('./admin/newsletter');
const adminOrderRoutes = require('./admin/orders');
const adminRecyclerRoutes = require('./admin/recyclers');
const adminRecyclerApplicationRoutes = require('./admin/recyclerApplications');
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
const recyclerDeviceConfigRoutes = require('./recycler/deviceConfig');
const recyclerOrderRoutes = require('./recycler/orders');
const recyclerPricingRoutes = require('./recycler/pricing');
const recyclerPreferencesRoutes = require('./recycler/preferences');
const recyclerProfileRoutes = require('./recycler/profile');
const recyclerReviewRoutes = require('./recycler/reviews');

// Import counter offer routes
const counterOfferRoutes = require('./counterOffer');

// Authentication routes
router.use('/auth/admin', adminAuthRoutes);
router.use('/auth/recycler', recyclerAuthRoutes);

// Admin routes (all protected with session validation)
router.use('/admin/contacts', validateAdminSession, requireAdmin, adminContactRoutes);
router.use('/admin/content', validateAdminSession, requireAdmin, adminContentRoutes);
router.use('/admin/customers', validateAdminSession, requireAdmin, adminCustomerRoutes);
router.use('/admin/dashboard', validateAdminSession, requireAdmin, adminDashboardRoutes);
router.use('/admin/devices', validateAdminSession, requireAdmin, adminDeviceRoutes);
router.use('/admin/metrics', validateAdminSession, requireAdmin, adminMetricsRoutes);
router.use('/admin/newsletters', validateAdminSession, requireAdmin, adminNewsletterRoutes);
router.use('/admin/orders', validateAdminSession, requireAdmin, adminOrderRoutes);
router.use('/admin/recyclers', validateAdminSession, requireAdmin, adminRecyclerRoutes);
router.use('/admin/recycler-applications', validateAdminSession, requireAdmin, adminRecyclerApplicationRoutes);
router.use('/admin/reviews', validateAdminSession, requireAdmin, adminReviewRoutes);
router.use('/admin/utilities', validateAdminSession, requireAdmin, adminUtilitiesRoutes);

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
router.use('/recycler/device-config', recyclerDeviceConfigRoutes);
router.use('/recycler/orders', recyclerOrderRoutes);
router.use('/recycler/pricing', recyclerPricingRoutes);
router.use('/recycler/preferences', recyclerPreferencesRoutes);
router.use('/recycler/profile', recyclerProfileRoutes);
router.use('/recycler/reviews', recyclerReviewRoutes);

// Counter offer routes (mixed - public and protected)
router.use('/counter-offers', counterOfferRoutes);

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
