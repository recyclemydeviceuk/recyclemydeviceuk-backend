// Admin device routes
const express = require('express');
const router = express.Router();
const {
  getAllDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  bulkDeleteDevices,
  updateDeviceStatus,
} = require('../../controllers/admin/deviceController');
const { protect, adminOnly } = require('../../middlewares/authMiddleware');

// All routes require authentication and admin role
router.use(protect, adminOnly);

// Device management routes
router.get('/', getAllDevices);
router.post('/', createDevice);
router.post('/bulk-delete', bulkDeleteDevices);
router.get('/:id', getDeviceById);
router.put('/:id', updateDevice);
router.delete('/:id', deleteDevice);
router.put('/:id/status', updateDeviceStatus);

module.exports = router;
