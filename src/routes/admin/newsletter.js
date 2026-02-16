// Admin newsletter routes
const express = require('express');
const router = express.Router();
const {
  getAllNewsletters,
  getNewsletterStats,
  updateNewsletterStatus,
  deleteNewsletter,
  bulkDeleteNewsletters,
  exportNewsletters,
} = require('../../controllers/admin/newsletterController');
const { protect, adminOnly } = require('../../middlewares/authMiddleware');

// All routes require authentication and admin role
router.use(protect, adminOnly);

// Newsletter management routes
router.get('/', getAllNewsletters);
router.get('/stats', getNewsletterStats);
router.get('/export', exportNewsletters);
router.patch('/:id/status', updateNewsletterStatus);
router.delete('/:id', deleteNewsletter);
router.post('/bulk-delete', bulkDeleteNewsletters);

module.exports = router;
