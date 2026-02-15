// Admin review routes
const express = require('express');
const router = express.Router();
const {
  getAllReviews,
  getReviewById,
  approveReview,
  rejectReview,
  deleteReview,
  bulkDeleteReviews,
  getReviewStats,
  flagReview,
} = require('../../controllers/admin/reviewController');
const { protect, adminOnly } = require('../../middlewares/authMiddleware');

// All routes require authentication and admin role
router.use(protect, adminOnly);

// Review management routes
router.get('/', getAllReviews);
router.get('/stats', getReviewStats);
router.post('/bulk-delete', bulkDeleteReviews);
router.get('/:id', getReviewById);
router.put('/:id/approve', approveReview);
router.put('/:id/reject', rejectReview);
router.put('/:id/flag', flagReview);
router.delete('/:id', deleteReview);

module.exports = router;
