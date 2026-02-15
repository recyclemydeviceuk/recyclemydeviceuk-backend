// Admin contact routes
const express = require('express');
const router = express.Router();
const {
  getAllContacts,
  getContactById,
  replyToContact,
  updateContactStatus,
  markAsRead,
  deleteContact,
  bulkDeleteContacts,
  getContactStats,
} = require('../../controllers/admin/contactController');
const { protect, adminOnly } = require('../../middlewares/authMiddleware');

// All routes require authentication and admin role
router.use(protect, adminOnly);

// Contact management routes
router.get('/', getAllContacts);
router.get('/stats', getContactStats);
router.get('/:id', getContactById);
router.post('/:id/reply', replyToContact);
router.put('/:id/status', updateContactStatus);
router.put('/:id/mark-read', markAsRead);
router.delete('/:id', deleteContact);
router.post('/bulk-delete', bulkDeleteContacts);

module.exports = router;
