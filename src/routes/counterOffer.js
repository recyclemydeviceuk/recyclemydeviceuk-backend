// Counter Offer routes
const express = require('express');
const router = express.Router();
const {
  createCounterOffer,
  getCounterOfferByToken,
  acceptCounterOffer,
  declineCounterOffer,
  getCounterOffersByOrder,
  uploadImages,
} = require('../controllers/counterOfferController');
const { protect, adminOnly, recyclerOnly, adminOrRecyclerOnly } = require('../middlewares/authMiddleware');
const { imageUpload, handleMulterError } = require('../middlewares/upload');

// Public routes (for customer)
router.get('/token/:token', getCounterOfferByToken);
router.post('/:token/accept', acceptCounterOffer);
router.post('/:token/decline', declineCounterOffer);

// Protected routes - ONLY RECYCLERS can create counter offers
router.post('/', protect, recyclerOnly, createCounterOffer);
router.get('/order/:orderId', protect, adminOrRecyclerOnly, getCounterOffersByOrder);
router.post('/upload-images', protect, recyclerOnly, imageUpload.array('images', 5), handleMulterError, uploadImages);

module.exports = router;
