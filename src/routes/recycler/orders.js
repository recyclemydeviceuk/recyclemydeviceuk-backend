// Recycler order routes
const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  addOrderNote,
  getOrdersByStatus,
  getOrderStats,
  exportOrders,
  getOrderStatuses,
  getPaymentStatuses,
} = require('../../controllers/recycler/orderController');
const { protect, recyclerOnly } = require('../../middlewares/authMiddleware');

// All routes require authentication and recycler role
router.use(protect, recyclerOnly);

// Utility routes (must come before parameterized routes)
router.get('/utilities/statuses', getOrderStatuses);
router.get('/utilities/payment-statuses', getPaymentStatuses);

// Order routes
router.get('/', getAllOrders);
router.get('/stats', getOrderStats);
router.get('/export', exportOrders);
router.get('/status/:status', getOrdersByStatus);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/payment-status', updatePaymentStatus);
router.post('/:id/notes', addOrderNote);

module.exports = router;
