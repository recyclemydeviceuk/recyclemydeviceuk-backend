// Contact form submissions
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
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
    trim: true,
  },
  subject: {
    type: String,
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
  },
  category: {
    type: String,
    default: 'General',
  },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'resolved', 'closed'],
    default: 'new',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  response: {
    type: String,
  },
  respondedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);
