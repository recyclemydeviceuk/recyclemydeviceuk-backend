// FAQ categories
const mongoose = require('mongoose');

const faqCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
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

faqCategorySchema.index({ name: 1 });

module.exports = mongoose.model('FAQCategory', faqCategorySchema);
