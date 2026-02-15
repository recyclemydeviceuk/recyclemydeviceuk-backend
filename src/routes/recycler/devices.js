// Recycler device routes
const express = require('express');
const router = express.Router();
const {
  getAllDevices,
  getDeviceById,
  getDevicesByCategory,
  getPopularDevices,
  searchDevices,
  getDeviceStats,
} = require('../../controllers/recycler/devicesController');
const { protect, recyclerOnly } = require('../../middlewares/authMiddleware');

// All routes require authentication and recycler role
router.use(protect, recyclerOnly);

// Device routes
router.get('/', getAllDevices);
router.get('/stats', getDeviceStats);
router.get('/popular', getPopularDevices);
router.get('/search', searchDevices);
router.get('/category/:category', getDevicesByCategory);
router.get('/:id', getDeviceById);

module.exports = router;
