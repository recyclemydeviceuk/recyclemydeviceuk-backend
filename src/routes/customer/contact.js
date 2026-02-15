// Public contact form routes (no authentication)
const express = require('express');
const router = express.Router();
const {
  submitContactForm,
  getContactCategories,
  subscribeNewsletter,
} = require('../../controllers/customer/contactController');

// All routes are public (no authentication required)

// Contact routes
router.post('/', submitContactForm);
router.get('/categories', getContactCategories);
router.post('/newsletter', subscribeNewsletter);

module.exports = router;
