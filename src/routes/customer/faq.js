// Public FAQ routes (no authentication)
const express = require('express');
const router = express.Router();
const {
  getAllFAQs,
  getFAQById,
  getFAQsByCategory,
  getAllCategories,
  searchFAQs,
  getPopularFAQs,
} = require('../../controllers/customer/faqController');

// All routes are public (no authentication required)

// FAQ routes
router.get('/', getAllFAQs);
router.get('/categories', getAllCategories);
router.get('/popular', getPopularFAQs);
router.get('/search', searchFAQs);
router.get('/category/:category', getFAQsByCategory);
router.get('/:id', getFAQById);

module.exports = router;
