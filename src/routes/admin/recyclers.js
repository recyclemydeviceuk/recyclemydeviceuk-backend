// Admin recycler routes
const express = require('express');
const router = express.Router();
const {
  getAllRecyclers,
  getRecyclerById,
  approveRecycler,
  rejectRecycler,
  suspendRecycler,
  activateRecycler,
  updateRecycler,
  deleteRecycler,
  getRecyclerStats,
  toggleActiveStatus,
} = require('../../controllers/admin/recyclerController');
const { protect, adminOnly } = require('../../middlewares/authMiddleware');

// All routes require authentication and admin role
router.use(protect, adminOnly);

// Recycler management routes
router.get('/', getAllRecyclers);
router.get('/stats', getRecyclerStats);
router.get('/:id', getRecyclerById);
router.put('/:id', updateRecycler);
router.put('/:id/approve', approveRecycler);
router.put('/:id/reject', rejectRecycler);
router.patch('/:id/suspend', suspendRecycler);
router.patch('/:id/activate', activateRecycler);
router.patch('/:id/toggle-active', toggleActiveStatus);
router.delete('/:id', deleteRecycler);

module.exports = router;
