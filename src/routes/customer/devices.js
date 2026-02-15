// Public device browsing routes (no authentication)
const express = require('express');
const router = express.Router();
const {
  getAllDevices,
  getDeviceById,
  searchDevices,
  getDevicesByBrand,
  getDevicesByCategory,
  getAllBrands,
  getPopularDevices,
} = require('../../controllers/customer/deviceController');

// All routes are public (no authentication required)

// Device routes
router.get('/', getAllDevices);
router.get('/search', searchDevices);
router.get('/brands', getAllBrands);
router.get('/popular', getPopularDevices);
router.get('/brand/:brand', getDevicesByBrand);
router.get('/category/:category', getDevicesByCategory);
router.get('/:id', getDeviceById);

module.exports = router;
