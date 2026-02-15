// Recycler profile routes
const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  updateBankDetails,
  getRecyclerStats,
  getActivityLog,
  updateBusinessHours,
} = require('../../controllers/recycler/profileController');
const { protect, recyclerOnly } = require('../../middlewares/authMiddleware');

// All routes require authentication and recycler role
router.use(protect, recyclerOnly);

// Profile routes
router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/password', changePassword);
router.put('/bank-details', updateBankDetails);
router.put('/business-hours', updateBusinessHours);
router.get('/stats', getRecyclerStats);
router.get('/activity-log', getActivityLog);

module.exports = router;
