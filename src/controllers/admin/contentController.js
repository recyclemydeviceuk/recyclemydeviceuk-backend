// Blog/FAQ management
const { HTTP_STATUS, PAGINATION } = require('../../config/constants');
const { uploadToS3, deleteFromS3 } = require('../../config/aws');

// ===== BLOG MANAGEMENT =====

// @desc    Get all blog posts
// @route   GET /api/admin/blog
// @access  Private/Admin
const getAllBlogs = async (req, res) => {
  try {
    const Blog = require('../../models/Blog');

    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const { status, category, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email');

    const total = await Blog.countDocuments(filter);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get All Blogs Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch blog posts',
      error: error.message,
    });
  }
};

// @desc    Get blog post by ID
// @route   GET /api/admin/blog/:id
// @access  Private/Admin
const getBlogById = async (req, res) => {
  try {
    const Blog = require('../../models/Blog');

    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name email');

    if (!blog) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Blog post not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error('Get Blog By ID Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch blog post',
      error: error.message,
    });
  }
};

// @desc    Create blog post
// @route   POST /api/admin/blog
// @access  Private/Admin
const createBlog = async (req, res) => {
  try {
    const Blog = require('../../models/Blog');

    // Handle image upload if present
    if (req.file) {
      const uploadResult = await uploadToS3(req.file, 'blog-images');
      req.body.featuredImage = uploadResult.url;
    }

    req.body.author = req.user._id;

    const blog = await Blog.create(req.body);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Blog post created successfully',
      data: blog,
    });
  } catch (error) {
    console.error('Create Blog Error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Failed to create blog post',
      error: error.message,
    });
  }
};

// @desc    Update blog post
// @route   PUT /api/admin/blog/:id
// @access  Private/Admin
const updateBlog = async (req, res) => {
  try {
    const Blog = require('../../models/Blog');

    // Handle image upload if present
    if (req.file) {
      const uploadResult = await uploadToS3(req.file, 'blog-images');
      req.body.featuredImage = uploadResult.url;
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!blog) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Blog post not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Blog post updated successfully',
      data: blog,
    });
  } catch (error) {
    console.error('Update Blog Error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Failed to update blog post',
      error: error.message,
    });
  }
};

// @desc    Delete blog post
// @route   DELETE /api/admin/blog/:id
// @access  Private/Admin
const deleteBlog = async (req, res) => {
  try {
    const Blog = require('../../models/Blog');

    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Blog post not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Blog post deleted successfully',
    });
  } catch (error) {
    console.error('Delete Blog Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete blog post',
      error: error.message,
    });
  }
};

// ===== FAQ MANAGEMENT =====

// @desc    Get all FAQs
// @route   GET /api/admin/faq
// @access  Private/Admin
const getAllFAQs = async (req, res) => {
  try {
    const FAQ = require('../../models/FAQ');

    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const { category, search } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
      ];
    }

    const faqs = await FAQ.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FAQ.countDocuments(filter);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: faqs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get All FAQs Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch FAQs',
      error: error.message,
    });
  }
};

// @desc    Get FAQ by ID
// @route   GET /api/admin/faq/:id
// @access  Private/Admin
const getFAQById = async (req, res) => {
  try {
    const FAQ = require('../../models/FAQ');

    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: faq,
    });
  } catch (error) {
    console.error('Get FAQ By ID Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch FAQ',
      error: error.message,
    });
  }
};

// @desc    Create FAQ
// @route   POST /api/admin/faq
// @access  Private/Admin
const createFAQ = async (req, res) => {
  try {
    const FAQ = require('../../models/FAQ');

    const faq = await FAQ.create(req.body);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'FAQ created successfully',
      data: faq,
    });
  } catch (error) {
    console.error('Create FAQ Error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Failed to create FAQ',
      error: error.message,
    });
  }
};

// @desc    Update FAQ
// @route   PUT /api/admin/faq/:id
// @access  Private/Admin
const updateFAQ = async (req, res) => {
  try {
    const FAQ = require('../../models/FAQ');

    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!faq) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'FAQ updated successfully',
      data: faq,
    });
  } catch (error) {
    console.error('Update FAQ Error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Failed to update FAQ',
      error: error.message,
    });
  }
};

// @desc    Delete FAQ
// @route   DELETE /api/admin/faq/:id
// @access  Private/Admin
const deleteFAQ = async (req, res) => {
  try {
    const FAQ = require('../../models/FAQ');

    const faq = await FAQ.findByIdAndDelete(req.params.id);

    if (!faq) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'FAQ deleted successfully',
    });
  } catch (error) {
    console.error('Delete FAQ Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete FAQ',
      error: error.message,
    });
  }
};

// @desc    Reorder FAQs
// @route   PATCH /api/admin/faq/reorder
// @access  Private/Admin
const reorderFAQs = async (req, res) => {
  try {
    const FAQ = require('../../models/FAQ');
    const { faqOrders } = req.body; // [{ id, order }]

    if (!faqOrders || !Array.isArray(faqOrders)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'FAQ orders array is required',
      });
    }

    // Update orders
    const updatePromises = faqOrders.map(({ id, order }) =>
      FAQ.findByIdAndUpdate(id, { order })
    );

    await Promise.all(updatePromises);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'FAQs reordered successfully',
    });
  } catch (error) {
    console.error('Reorder FAQs Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to reorder FAQs',
      error: error.message,
    });
  }
};

module.exports = {
  // Blog
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  // FAQ
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  reorderFAQs,
};
