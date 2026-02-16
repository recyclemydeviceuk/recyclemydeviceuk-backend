// Device listings schema
const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Device name is required'],
    trim: true,
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: [true, 'Brand is required'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    lowercase: true,
    trim: true,
  },
  image: {
    type: String,
    default: '',
  },
  images: [{
    type: String,
  }],
  description: {
    type: String,
    default: '',
  },
  // Admin-managed storage options (e.g., ['64GB', '128GB', '256GB'])
  storageOptions: [{
    type: String,
    trim: true,
  }],
  // Admin-managed condition options (e.g., ['Excellent', 'Good', 'Fair', 'Poor'])
  conditionOptions: [{
    type: String,
    trim: true,
  }],
  specifications: {
    processor: String,
    ram: String,
    display: String,
    camera: String,
    battery: String,
    color: [String],
    connectivity: [String],
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active',
  },
  views: {
    type: Number,
    default: 0,
  },
  popularityScore: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index for search
deviceSchema.index({ name: 'text' });
deviceSchema.index({ brand: 1, category: 1 });
deviceSchema.index({ status: 1 });

module.exports = mongoose.model('Device', deviceSchema);
