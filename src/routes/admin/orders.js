// Admin order routes
const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  assignOrderToRecycler,
  deleteOrder,
  bulkUpdateOrders,
  exportOrders,
} = require('../../controllers/admin/orderController');
const { protect, adminOnly } = require('../../middlewares/authMiddleware');

// All routes require authentication and admin role
router.use(protect, adminOnly);

// Order management routes
router.get('/', getAllOrders);
router.get('/export', exportOrders);
router.post('/bulk-update', bulkUpdateOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/payment-status', updatePaymentStatus);
router.put('/:id/assign-recycler', assignOrderToRecycler);
router.delete('/:id', deleteOrder);

module.exports = router;
