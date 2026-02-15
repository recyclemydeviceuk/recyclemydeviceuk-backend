// Payment status types
const mongoose = require('mongoose');

const paymentStatusSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Status name is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  label: {
    type: String,
    required: [true, 'Status label is required'],
    trim: true,
  },
  description: {
    type: String,
  },
  color: {
    type: String,
    default: '#6B7280',
  },
  emailMessage: {
    type: String,
    trim: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

paymentStatusSchema.index({ name: 1 });

module.exports = mongoose.model('PaymentStatus', paymentStatusSchema);
