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
} = require('../../controllers/recycler/orderController');
const { protect, recyclerOnly } = require('../../middlewares/authMiddleware');

// All routes require authentication and recycler role
router.use(protect, recyclerOnly);

// Order routes
router.get('/', getAllOrders);
router.get('/stats', getOrderStats);
router.get('/export', exportOrders);
router.get('/status/:status', getOrdersByStatus);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/payment-status', updatePaymentStatus);
router.post('/:id/notes', addOrderNote);

module.exports = router;
