const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'unsubscribed'],
    default: 'active',
  },
  unsubscribedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
newsletterSchema.index({ email: 1 });
newsletterSchema.index({ status: 1 });

module.exports = mongoose.model('Newsletter', newsletterSchema);
