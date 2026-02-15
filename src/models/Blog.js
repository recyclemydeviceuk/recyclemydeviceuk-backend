// Blog posts schema
const mongoose = require('mongoose');

// Helper function to create URL-friendly slug
const createSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
  },
  excerpt: {
    type: String,
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  image: {
    type: String,
  },
  category: {
    type: String,
    required: true,
  },
  tags: [{
    type: String,
  }],
  author: {
    type: String,
    default: 'Recycle My Device Team',
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  featured: {
    type: Boolean,
    default: false,
  },
  views: {
    type: Number,
    default: 0,
  },
  readTime: {
    type: Number,
  },
  publishedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for search
blogSchema.index({ title: 'text', content: 'text', excerpt: 'text' });
blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1, publishedAt: -1 });

// Pre-save middleware to auto-generate slug if not provided
blogSchema.pre('save', async function(next) {
  if (!this.slug && this.title) {
    let baseSlug = createSlug(this.title);
    let slug = baseSlug;
    let counter = 1;
    
    // Check for existing slugs and append counter if needed
    const Blog = mongoose.model('Blog');
    while (await Blog.exists({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
