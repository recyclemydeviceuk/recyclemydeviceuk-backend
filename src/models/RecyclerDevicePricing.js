// Recycler-specific device pricing
const mongoose = require('mongoose');

const recyclerDevicePricingSchema = new mongoose.Schema({
  recyclerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recycler',
    required: [true, 'Recycler ID is required'],
    index: true,
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Device ID is required'],
    index: true,
  },
  // Storage-based pricing (dynamic format to support any condition)
  storagePricing: [{
    storage: {
      type: String,
      required: true,
    },
    conditions: {
      type: Map,
      of: Number,
      default: {},
    },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Compound index to ensure unique pricing per recycler per device
recyclerDevicePricingSchema.index({ recyclerId: 1, deviceId: 1 }, { unique: true });

module.exports = mongoose.model('RecyclerDevicePricing', recyclerDevicePricingSchema);
