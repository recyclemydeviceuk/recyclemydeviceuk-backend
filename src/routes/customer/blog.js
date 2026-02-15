// Public blog routes (no authentication)
const express = require('express');
const router = express.Router();
const {
  getAllBlogs,
  getBlogById,
  getFeaturedBlogs,
  getRecentBlogs,
  getBlogsByCategory,
  getAllCategories,
  searchBlogs,
} = require('../../controllers/customer/blogController');

// All routes are public (no authentication required)

// Blog routes
router.get('/', getAllBlogs);
router.get('/featured', getFeaturedBlogs);
router.get('/recent', getRecentBlogs);
router.get('/categories', getAllCategories);
router.get('/search', searchBlogs);
router.get('/category/:category', getBlogsByCategory);
router.get('/:idOrSlug', getBlogById);

module.exports = router;
