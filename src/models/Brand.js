// Device brands list
const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    unique: true,
    trim: true,
  },
  logo: {
    type: String,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

brandSchema.index({ name: 1 });

module.exports = mongoose.model('Brand', brandSchema);
