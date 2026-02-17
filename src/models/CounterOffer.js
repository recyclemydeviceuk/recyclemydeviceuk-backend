// Counter Offer model
const mongoose = require('mongoose');

const counterOfferSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  orderNumber: {
    type: String,
    required: true,
  },
  // Original offer details
  originalPrice: {
    type: Number,
    required: true,
  },
  // Counter offer details
  amendedPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  // Images showing device condition
  images: [{
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
    },
  }],
  // Customer info (cached for easy access)
  customerName: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
  },
  customerPhone: {
    type: String,
  },
  // Who created the counter offer
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel',
    required: true,
  },
  createdByModel: {
    type: String,
    required: true,
    enum: ['Admin', 'Recycler'],
  },
  createdByName: {
    type: String,
  },
  // Status tracking
  status: {
    type: String,
    required: true,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending',
  },
  // Unique token for customer access
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  // Response tracking
  respondedAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
    required: true,
    // Default to 7 days from creation
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  // Customer response notes
  customerNotes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
counterOfferSchema.index({ orderId: 1, status: 1 });
counterOfferSchema.index({ token: 1 });
counterOfferSchema.index({ expiresAt: 1 });

// Virtual for checking if expired
counterOfferSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date() && this.status === 'pending';
});

module.exports = mongoose.model('CounterOffer', counterOfferSchema);
