// Public review routes (no authentication)
const express = require('express');
const router = express.Router();
const {
  submitReview,
  getRecyclerReviews,
  getRecyclerReviewStats,
  checkReviewEligibility,
} = require('../../controllers/customer/reviewController');

// All routes are public (no authentication required)

// Review routes
router.post('/', submitReview);
router.get('/recycler/:recyclerId', getRecyclerReviews);
router.get('/recycler/:recyclerId/stats', getRecyclerReviewStats);
router.post('/check-eligibility', checkReviewEligibility);

module.exports = router;
