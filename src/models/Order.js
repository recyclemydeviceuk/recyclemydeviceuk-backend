// Orders schema
// Note: Customers are guests (no account creation)
// Store customer data inline: name, email, phone, address, etc.
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
  },
  recyclerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recycler',
    required: true,
  },
  // Guest customer information (inline)
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  customerEmail: {
    type: String,
    required: [true, 'Customer email is required'],
    lowercase: true,
    trim: true,
  },
  customerPhone: {
    type: String,
    required: [true, 'Customer phone is required'],
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  postcode: {
    type: String,
    trim: true,
  },
  // Device details at time of order
  deviceCondition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    required: true,
  },
  storage: {
    type: String,
  },
  deviceNotes: {
    type: String,
  },
  // Pricing
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  // Order status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending',
  },
  statusNotes: {
    type: String,
  },
  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  transactionId: {
    type: String,
  },
  paidAt: {
    type: Date,
  },
  // Tracking
  trackingNumber: {
    type: String,
  },
  shippingLabel: {
    type: String,
  },
  // Timestamps
  completedAt: {
    type: Date,
  },
  cancellationReason: {
    type: String,
  },
  // Notes
  notes: [{
    text: String,
    createdBy: mongoose.Schema.Types.ObjectId,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customerEmail: 1 });
orderSchema.index({ recyclerId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
