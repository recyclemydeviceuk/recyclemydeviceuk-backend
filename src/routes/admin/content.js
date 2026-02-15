// Admin content routes (Blogs & FAQs)
const express = require('express');
const router = express.Router();
const {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  reorderFAQs,
} = require('../../controllers/admin/contentController');
const { protect, adminOnly } = require('../../middlewares/authMiddleware');

// All routes require authentication and admin role
router.use(protect, adminOnly);

// Blog management routes
router.get('/blogs', getAllBlogs);
router.post('/blogs', createBlog);
router.get('/blogs/:id', getBlogById);
router.put('/blogs/:id', updateBlog);
router.delete('/blogs/:id', deleteBlog);

// FAQ management routes
router.get('/faqs', getAllFAQs);
router.post('/faqs', createFAQ);
router.put('/faqs/reorder', reorderFAQs);
router.get('/faqs/:id', getFAQById);
router.put('/faqs/:id', updateFAQ);
router.delete('/faqs/:id', deleteFAQ);

module.exports = router;
