// Recycler preferences routes
const express = require('express');
const router = express.Router();
const {
  getPreferences,
  updatePreferences,
} = require('../../controllers/recycler/preferencesController');
const { validateRecyclerSession, requireRecycler } = require('../../middlewares/sessionMiddleware');

// All routes require session authentication and recycler role
router.use(validateRecyclerSession, requireRecycler);

// Preferences routes
router.get('/', getPreferences);
router.put('/', updatePreferences);

module.exports = router;
