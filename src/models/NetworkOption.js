// Network options for devices (e.g., Unlocked, Locked, EE, Vodafone)
const mongoose = require('mongoose');

const networkOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Network option name is required'],
    unique: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['mobile', 'tablet', 'all'],
    default: 'all',
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

networkOptionSchema.index({ category: 1, order: 1 });

module.exports = mongoose.model('NetworkOption', networkOptionSchema);
