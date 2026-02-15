// Recycler application submissions
const mongoose = require('mongoose');

const recyclerApplicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true,
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  website: {
    type: String,
    trim: true,
  },
  businessDescription: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
  },
  approvalNotes: {
    type: String,
  },
  processedAt: {
    type: Date,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  convertedToRecycler: {
    type: Boolean,
    default: false,
  },
  recyclerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recycler',
  },
}, {
  timestamps: true,
});

// Indexes
recyclerApplicationSchema.index({ email: 1 });
recyclerApplicationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('RecyclerApplication', recyclerApplicationSchema);
