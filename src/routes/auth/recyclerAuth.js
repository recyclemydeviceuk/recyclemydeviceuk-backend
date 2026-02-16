// Recycler authentication routes - OTP with Session Management
const express = require('express');
const router = express.Router();
const {
  sendRecyclerOTP,
  verifyRecyclerOTP,
  logoutRecycler,
  changeRecyclerPassword,
  forgotPassword,
  resetPassword,
  getRecyclerProfile,
  updateRecyclerProfile,
  getRecyclerStats,
} = require('../../controllers/auth/recyclerAuthController');
const { validateRecyclerSession, requireRecycler } = require('../../middlewares/sessionMiddleware');

// Public routes (no authentication required)
router.post('/send-otp', sendRecyclerOTP);
router.post('/verify-otp', verifyRecyclerOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (session authentication required)
router.post('/logout', validateRecyclerSession, requireRecycler, logoutRecycler);
router.put('/change-password', validateRecyclerSession, requireRecycler, changeRecyclerPassword);
router.get('/profile', validateRecyclerSession, requireRecycler, getRecyclerProfile);
router.put('/profile', validateRecyclerSession, requireRecycler, updateRecyclerProfile);
router.get('/stats', validateRecyclerSession, requireRecycler, getRecyclerStats);

module.exports = router;
