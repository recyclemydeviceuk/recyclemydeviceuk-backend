// Admin utilities routes
const express = require('express');
const router = express.Router();
const {
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  uploadImage,
  getStorageOptions,
  createStorageOption,
  updateStorageOption,
  deleteStorageOption,
  getAllDeviceCategories,
  createDeviceCategory,
  updateDeviceCategory,
  deleteDeviceCategory,
  getAllConditions,
  createCondition,
  updateCondition,
  deleteCondition,
  getAllBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  getAllFAQCategories,
  createFAQCategory,
  updateFAQCategory,
  deleteFAQCategory,
  getDeviceConditions,
  getDeviceCategories,
  getOrderStatuses,
  getPaymentStatuses,
  getRecyclerStatuses,
  getSystemSettings,
  updateSystemSettings,
  getPriceRanges,
  createOrderStatus,
  updateOrderStatus,
  deleteOrderStatus,
  createPaymentStatus,
  updatePaymentStatus,
  deletePaymentStatus,
  cleanupOldData,
} = require('../../controllers/admin/utilitiesController');
const { uploadSingle } = require('../../middlewares/upload');

// Authentication is already applied in main router (validateAdminSession, requireAdmin)

// Image upload route
router.post('/upload-image', uploadSingle('image'), uploadImage);

// Brand management routes
router.get('/brands', getAllBrands);
router.post('/brands', uploadSingle('logo'), createBrand);
router.put('/brands/:id', uploadSingle('logo'), updateBrand);
router.delete('/brands/:id', deleteBrand);

// Storage options CRUD routes
router.get('/storage-options', getStorageOptions);
router.post('/storage-options', createStorageOption);
router.put('/storage-options/:id', updateStorageOption);
router.delete('/storage-options/:id', deleteStorageOption);

// Device categories CRUD routes
router.get('/device-categories', getAllDeviceCategories);
router.post('/device-categories', createDeviceCategory);
router.put('/device-categories/:id', updateDeviceCategory);
router.delete('/device-categories/:id', deleteDeviceCategory);

// Conditions CRUD routes
router.get('/conditions', getAllConditions);
router.post('/conditions', createCondition);
router.put('/conditions/:id', updateCondition);
router.delete('/conditions/:id', deleteCondition);

// Blog categories CRUD routes
router.get('/blog-categories', getAllBlogCategories);
router.post('/blog-categories', createBlogCategory);
router.put('/blog-categories/:id', updateBlogCategory);
router.delete('/blog-categories/:id', deleteBlogCategory);

// FAQ categories CRUD routes
router.get('/faq-categories', getAllFAQCategories);
router.post('/faq-categories', createFAQCategory);
router.put('/faq-categories/:id', updateFAQCategory);
router.delete('/faq-categories/:id', deleteFAQCategory);

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
