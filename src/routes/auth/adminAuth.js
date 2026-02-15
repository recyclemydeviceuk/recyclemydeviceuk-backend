// Admin authentication routes
const express = require('express');
const router = express.Router();
const {
  checkAdminEmail,
  sendAdminOTP,
  verifyAdminOTP,
  changeAdminPassword,
  getAdminProfile,
  updateAdminProfile,
} = require('../../controllers/auth/adminAuthController');
const { protect, adminOnly } = require('../../middlewares/authMiddleware');

// Public routes (no authentication required)
router.post('/check-email', checkAdminEmail);
router.post('/send-otp', sendAdminOTP);
router.post('/verify-otp', verifyAdminOTP);

// Protected routes (authentication required)
router.put('/change-password', protect, adminOnly, changeAdminPassword);
router.get('/profile', protect, adminOnly, getAdminProfile);
router.put('/profile', protect, adminOnly, updateAdminProfile);

module.exports = router;
