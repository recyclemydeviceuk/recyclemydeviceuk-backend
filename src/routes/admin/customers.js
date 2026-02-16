// Admin customer management routes
const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomerById,
  getCustomerStats,
} = require('../../controllers/admin/customerController');

// Customer statistics
router.get('/stats', getCustomerStats);

// Customer management routes
router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);

module.exports = router;
