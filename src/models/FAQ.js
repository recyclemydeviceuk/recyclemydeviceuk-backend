// FAQs schema
const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
  },
  answer: {
    type: String,
    required: [true, 'Answer is required'],
  },
  category: {
    type: String,
    required: true,
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
  views: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index for search
faqSchema.index({ question: 'text', answer: 'text' });
faqSchema.index({ category: 1, order: 1 });

module.exports = mongoose.model('FAQ', faqSchema);
