// View blogs
const { HTTP_STATUS, PAGINATION } = require('../../config/constants');

// @desc    Get all published blog posts
// @route   GET /api/customer/blogs
// @access  Public
const getAllBlogs = async (req, res) => {
  try {
    const Blog = require('../../models/Blog');

    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const { category, search } = req.query;

    // Build filter - only show published blogs
    const filter = { status: 'published' };

    if (category) filter.category = category;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
      ];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title excerpt image category author publishedAt readTime'),
      Blog.countDocuments(filter),
    ]);

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
      message: 'Failed to fetch blogs',
      error: error.message,
    });
  }
};

// @desc    Get blog by ID or slug
// @route   GET /api/customer/blogs/:idOrSlug
// @access  Public
const getBlogById = async (req, res) => {
  try {
    const Blog = require('../../models/Blog');
    const { idOrSlug } = req.params;

    // Validate idOrSlug parameter
    if (!idOrSlug || idOrSlug === 'undefined' || idOrSlug === 'null') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid blog identifier',
      });
    }

    // Try to find by ID first, then by slug
    let blog = null;
    
    // Only try ID lookup if it looks like a valid MongoDB ObjectId (24 hex chars)
    if (/^[0-9a-fA-F]{24}$/.test(idOrSlug)) {
      blog = await Blog.findOne({ 
        _id: idOrSlug,
        status: 'published' 
      });
    }

    // If not found by ID, try slug lookup
    if (!blog) {
      blog = await Blog.findOne({ 
        slug: idOrSlug,
        status: 'published' 
      });
    }

    if (!blog) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Blog post not found',
      });
    }

    // Increment views
    blog.views = (blog.views || 0) + 1;
    await blog.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error('Get Blog By ID Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch blog',
      error: error.message,
    });
  }
};

// @desc    Get featured blogs
// @route   GET /api/customer/blogs/featured/list
// @access  Public
const getFeaturedBlogs = async (req, res) => {
  try {
    const Blog = require('../../models/Blog');
    const limit = parseInt(req.query.limit) || 3;

    const blogs = await Blog.find({ 
      status: 'published',
      featured: true,
    })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .select('title excerpt image category author publishedAt readTime');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    console.error('Get Featured Blogs Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch featured blogs',
      error: error.message,
    });
  }
};

// @desc    Get recent blogs
// @route   GET /api/customer/blogs/recent/list
// @access  Public
const getRecentBlogs = async (req, res) => {
  try {
    const Blog = require('../../models/Blog');
    const limit = parseInt(req.query.limit) || 5;

    const blogs = await Blog.find({ status: 'published' })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .select('title excerpt image category publishedAt');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    console.error('Get Recent Blogs Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch recent blogs',
      error: error.message,
    });
  }
};

// @desc    Get blogs by category
// @route   GET /api/customer/blogs/category/:category
// @access  Public
const getBlogsByCategory = async (req, res) => {
  try {
    const Blog = require('../../models/Blog');
    const { category } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const blogs = await Blog.find({ 
      category,
      status: 'published',
    })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .select('title excerpt image author publishedAt readTime');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    console.error('Get Blogs By Category Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch blogs by category',
      error: error.message,
    });
  }
};

// @desc    Get all blog categories
// @route   GET /api/customer/blogs/categories/all
// @access  Public
const getAllCategories = async (req, res) => {
  try {
    const Blog = require('../../models/Blog');

    const categories = await Blog.distinct('category', { status: 'published' });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: categories.sort(),
    });
  } catch (error) {
    console.error('Get All Categories Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
};

// @desc    Search blogs
// @route   GET /api/customer/blogs/search
// @access  Public
const searchBlogs = async (req, res) => {
  try {
    const Blog = require('../../models/Blog');
    const { query } = req.query;

    if (!query) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const blogs = await Blog.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { excerpt: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
      ],
      status: 'published',
    })
      .limit(20)
      .select('title excerpt image category publishedAt')
      .sort({ publishedAt: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    console.error('Search Blogs Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to search blogs',
      error: error.message,
    });
  }
};

module.exports = {
  getAllBlogs,
  getBlogById,
  getFeaturedBlogs,
  getRecentBlogs,
  getBlogsByCategory,
  getAllCategories,
  searchBlogs,
};
