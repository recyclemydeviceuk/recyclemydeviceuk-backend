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
const { validateRecyclerSession, requireRecycler } = require('../../middlewares/sessionMiddleware');

// All routes require session authentication and recycler role
router.use(validateRecyclerSession, requireRecycler);

// Device routes
router.get('/', getAllDevices);
router.get('/stats', getDeviceStats);
router.get('/popular', getPopularDevices);
router.get('/search', searchDevices);
router.get('/category/:category', getDevicesByCategory);
router.get('/:id', getDeviceById);

module.exports = router;
