// Admin recycler application routes
const express = require('express');
const router = express.Router();
const {
  getAllApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
  deleteApplication,
  getApplicationStats,
} = require('../../controllers/admin/recyclerApplicationController');

// Application statistics
router.get('/stats', getApplicationStats);

// Application management routes
router.get('/', getAllApplications);
router.get('/:id', getApplicationById);
router.patch('/:id/approve', approveApplication);
router.patch('/:id/reject', rejectApplication);
router.delete('/:id', deleteApplication);

module.exports = router;
