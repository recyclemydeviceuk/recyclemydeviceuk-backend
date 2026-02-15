const express = require('express');
const router = express.Router();
const {
  submitApplication,
} = require('../../controllers/customer/recyclerApplicationController');

// Submit recycler application
router.post('/apply', submitApplication);

module.exports = router;
