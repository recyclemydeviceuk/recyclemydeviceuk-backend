// View FAQs
const { HTTP_STATUS } = require('../../config/constants');

// @desc    Get all FAQs
// @route   GET /api/customer/faqs
// @access  Public
const getAllFAQs = async (req, res) => {
  try {
    const FAQ = require('../../models/FAQ');

    const { category, search } = req.query;

    // Build filter - only active FAQs
    const filter = { status: 'active' };

    if (category) filter.category = category;

    if (search) {
      filter.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
      ];
    }

    const faqs = await FAQ.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .select('question answer category order');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: faqs,
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
// @route   GET /api/customer/faqs/:id
// @access  Public
const getFAQById = async (req, res) => {
  try {
    const FAQ = require('../../models/FAQ');

    const faq = await FAQ.findOne({ 
      _id: req.params.id, 
      status: 'active' 
    });

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

// @desc    Get FAQs by category
// @route   GET /api/customer/faqs/category/:category
// @access  Public
const getFAQsByCategory = async (req, res) => {
  try {
    const FAQ = require('../../models/FAQ');
    const { category } = req.params;

    const faqs = await FAQ.find({ 
      category, 
      status: 'active' 
    })
      .sort({ order: 1 })
      .select('question answer order');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    console.error('Get FAQs By Category Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch FAQs by category',
      error: error.message,
    });
  }
};

// @desc    Get all FAQ categories
// @route   GET /api/customer/faqs/categories/all
// @access  Public
const getAllCategories = async (req, res) => {
  try {
    const FAQ = require('../../models/FAQ');

    const categories = await FAQ.distinct('category', { status: 'active' });

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

// @desc    Search FAQs
// @route   GET /api/customer/faqs/search
// @access  Public
const searchFAQs = async (req, res) => {
  try {
    const FAQ = require('../../models/FAQ');
    const { query } = req.query;

    if (!query) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const faqs = await FAQ.find({
      $or: [
        { question: { $regex: query, $options: 'i' } },
        { answer: { $regex: query, $options: 'i' } },
      ],
      status: 'active',
    })
      .sort({ order: 1 })
      .limit(20)
      .select('question answer category');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    console.error('Search FAQs Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to search FAQs',
      error: error.message,
    });
  }
};

// @desc    Get popular FAQs
// @route   GET /api/customer/faqs/popular
// @access  Public
const getPopularFAQs = async (req, res) => {
  try {
    const FAQ = require('../../models/FAQ');
    const limit = parseInt(req.query.limit) || 5;

    const faqs = await FAQ.find({ status: 'active' })
      .sort({ views: -1, order: 1 })
      .limit(limit)
      .select('question answer category views');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    console.error('Get Popular FAQs Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch popular FAQs',
      error: error.message,
    });
  }
};

module.exports = {
  getAllFAQs,
  getFAQById,
  getFAQsByCategory,
  getAllCategories,
  searchFAQs,
  getPopularFAQs,
};
