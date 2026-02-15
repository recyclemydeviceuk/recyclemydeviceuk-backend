// Public order routes (no authentication)
const express = require('express');
const router = express.Router();
const {
  createOrder,
  trackOrder,
  verifyOrder,
  getPriceQuote,
  cancelOrder,
} = require('../../controllers/customer/orderController');

// All routes are public (no authentication required)

// Order routes
router.post('/', createOrder);
router.post('/quote', getPriceQuote);
router.post('/verify', verifyOrder);
router.get('/track/:orderNumber', trackOrder);
router.post('/:orderNumber/cancel', cancelOrder);

// Guest order routes (PUBLIC - no authentication)
// POST /api/customer/orders - Create order with customer data
// GET /api/customer/orders/:orderNumber - Track order by order number

module.exports = router;
