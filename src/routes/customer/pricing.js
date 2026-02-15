// Customer pricing routes
const express = require('express');
const router = express.Router();
const { getDevicePrices } = require('../../controllers/customer/pricingController');

// All routes are public (no authentication required)
router.get('/device/:deviceId', getDevicePrices);

module.exports = router;
