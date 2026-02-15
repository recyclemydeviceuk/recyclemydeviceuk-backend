// Device conditions
const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Condition name is required'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
  },
  priceMultiplier: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
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

conditionSchema.index({ name: 1 });

module.exports = mongoose.model('Condition', conditionSchema);
