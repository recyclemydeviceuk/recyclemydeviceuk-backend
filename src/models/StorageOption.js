// Storage options for devices
const mongoose = require('mongoose');

const storageOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Storage option name is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['smartphone', 'tablet', 'laptop', 'smartwatch', 'console', 'other', 'default'],
    default: 'default',
  },
  description: {
    type: String,
  },
  order: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, {
  timestamps: true,
});

storageOptionSchema.index({ name: 1, category: 1 });

module.exports = mongoose.model('StorageOption', storageOptionSchema);
