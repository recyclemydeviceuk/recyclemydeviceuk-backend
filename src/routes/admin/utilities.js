// Admin utilities routes
const express = require('express');
const router = express.Router();
const {
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  getDeviceConditions,
  getDeviceCategories,
  getOrderStatuses,
  getPaymentStatuses,
  getRecyclerStatuses,
  getSystemSettings,
  updateSystemSettings,
  getStorageOptions,
  getPriceRanges,
  createOrderStatus,
  updateOrderStatus,
  deleteOrderStatus,
  createPaymentStatus,
  updatePaymentStatus,
  deletePaymentStatus,
  cleanupOldData,
} = require('../../controllers/admin/utilitiesController');
const { protect, adminOnly } = require('../../middlewares/authMiddleware');

// All routes require authentication and admin role
router.use(protect, adminOnly);

// Brand management routes
router.get('/brands', getAllBrands);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

// Constants routes
router.get('/constants/device-conditions', getDeviceConditions);
router.get('/constants/device-categories', getDeviceCategories);
router.get('/constants/order-statuses', getOrderStatuses);
router.get('/constants/payment-statuses', getPaymentStatuses);
router.get('/constants/recycler-statuses', getRecyclerStatuses);
router.get('/constants/storage-options', getStorageOptions);
router.get('/constants/price-ranges', getPriceRanges);

// Order status management routes
router.post('/order-statuses', createOrderStatus);
router.put('/order-statuses/:id', updateOrderStatus);
router.delete('/order-statuses/:id', deleteOrderStatus);

// Payment status management routes
router.post('/payment-statuses', createPaymentStatus);
router.put('/payment-statuses/:id', updatePaymentStatus);
router.delete('/payment-statuses/:id', deletePaymentStatus);

// System settings routes
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

// Data cleanup routes
router.post('/cleanup', cleanupOldData);

module.exports = router;
