// Device categories
const mongoose = require('mongoose');

const deviceCategorySchema = new mongoose.Schema({
  value: {
    type: String,
    required: [true, 'Category value is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  label: {
    type: String,
    required: [true, 'Category label is required'],
    trim: true,
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

deviceCategorySchema.index({ value: 1 });

module.exports = mongoose.model('DeviceCategory', deviceCategorySchema);
