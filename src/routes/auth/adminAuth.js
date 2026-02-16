// Admin authentication routes
const express = require('express');
const router = express.Router();
const {
  checkAdminEmail,
  sendAdminOTP,
  verifyAdminOTP,
  logoutAdmin,
  changeAdminPassword,
  getAdminProfile,
  updateAdminProfile,
} = require('../../controllers/auth/adminAuthController');
const { validateAdminSession, requireAdmin } = require('../../middlewares/sessionMiddleware');

// Public routes (no authentication required)
router.post('/check-email', checkAdminEmail);
router.post('/send-otp', sendAdminOTP);
router.post('/verify-otp', verifyAdminOTP);

// Protected routes (session authentication required)
router.post('/logout', validateAdminSession, requireAdmin, logoutAdmin);
router.put('/change-password', validateAdminSession, requireAdmin, changeAdminPassword);
router.get('/profile', validateAdminSession, requireAdmin, getAdminProfile);
router.put('/profile', validateAdminSession, requireAdmin, updateAdminProfile);

module.exports = router;
