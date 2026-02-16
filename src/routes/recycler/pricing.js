// Recycler pricing routes
const express = require('express');
const router = express.Router();
const {
  getAllPricing,
  getPricingByDevice,
  createOrUpdatePricing,
  deletePricing,
  getAvailableDevices,
} = require('../../controllers/recycler/pricingController');
const { validateRecyclerSession, requireRecycler } = require('../../middlewares/sessionMiddleware');

// All routes require session authentication and recycler role
router.use(validateRecyclerSession, requireRecycler);

// Pricing routes
router.get('/', getAllPricing);
router.get('/available-devices', getAvailableDevices);
router.get('/device/:deviceId', getPricingByDevice);
router.post('/', createOrUpdatePricing);
router.delete('/:id', deletePricing);

module.exports = router;
