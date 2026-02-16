// Recycler device configuration routes (batch operations)
const express = require('express');
const router = express.Router();
const {
  batchSaveConfiguration,
  getConfiguration,
} = require('../../controllers/recycler/devicePricingBatchController');
const { validateRecyclerSession, requireRecycler } = require('../../middlewares/sessionMiddleware');

// All routes require session authentication and recycler role
router.use(validateRecyclerSession, requireRecycler);

// Configuration routes
router.get('/', getConfiguration);
router.post('/batch-save', batchSaveConfiguration);

module.exports = router;
