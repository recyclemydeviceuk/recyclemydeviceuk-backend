// Recycler partner schema
const mongoose = require('mongoose');

const recyclerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
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
  logo: {
    type: String,
  },
  usps: [{
    type: String,
  }],
  businessDescription: {
    type: String,
  },
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  postcode: {
    type: String,
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    sortCode: String,
    bankName: String,
  },
  businessHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String },
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
  },
  approvalNotes: {
    type: String,
  },
  approvedAt: {
    type: Date,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  lastLogin: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
recyclerSchema.index({ email: 1 });
recyclerSchema.index({ status: 1 });
recyclerSchema.index({ companyName: 1 });

module.exports = mongoose.model('Recycler', recyclerSchema);
