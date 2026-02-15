// Recycler authentication routes
const express = require('express');
const router = express.Router();
const {
  sendRecyclerOTP,
  verifyRecyclerOTP,
  changeRecyclerPassword,
  forgotPassword,
  resetPassword,
  getRecyclerProfile,
  updateRecyclerProfile,
  getRecyclerStats,
} = require('../../controllers/auth/recyclerAuthController');
const { protect, recyclerOnly } = require('../../middlewares/authMiddleware');

// Public routes (no authentication required)
router.post('/send-otp', sendRecyclerOTP);
router.post('/verify-otp', verifyRecyclerOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (authentication required)
router.put('/change-password', protect, recyclerOnly, changeRecyclerPassword);
router.get('/profile', protect, recyclerOnly, getRecyclerProfile);
router.put('/profile', protect, recyclerOnly, updateRecyclerProfile);
router.get('/stats', protect, recyclerOnly, getRecyclerStats);

module.exports = router;
