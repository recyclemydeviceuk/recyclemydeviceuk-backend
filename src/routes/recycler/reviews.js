// Recycler review routes
const express = require('express');
const router = express.Router();
const {
  getAllReviews,
  getReviewById,
  getReviewStats,
  getReviewsByRating,
  getRecentReviews,
  respondToReview,
  getRatingBreakdown,
} = require('../../controllers/recycler/reviewController');
const { protect, recyclerOnly } = require('../../middlewares/authMiddleware');

// All routes require authentication and recycler role
router.use(protect, recyclerOnly);

// Review routes
router.get('/', getAllReviews);
router.get('/stats', getReviewStats);
router.get('/recent', getRecentReviews);
router.get('/rating-breakdown', getRatingBreakdown);
router.get('/rating/:rating', getReviewsByRating);
router.get('/:id', getReviewById);
router.post('/:id/respond', respondToReview);

module.exports = router;
