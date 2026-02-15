// Recycler reviews view
const { HTTP_STATUS, PAGINATION } = require('../../config/constants');

// @desc    Get all reviews for recycler
// @route   GET /api/recycler/reviews
// @access  Private/Recycler
const getAllReviews = async (req, res) => {
  try {
    const Review = require('../../models/Review');

    const recyclerId = req.user._id;
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const { rating, status } = req.query;

    // Build filter
    const filter = { recyclerId };

    if (rating) filter.rating = parseInt(rating);
    if (status) filter.status = status;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .populate('orderId', 'orderNumber'),
      Review.countDocuments(filter),
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get All Reviews Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message,
    });
  }
};

// @desc    Get review by ID
// @route   GET /api/recycler/reviews/:id
// @access  Private/Recycler
const getReviewById = async (req, res) => {
  try {
    const Review = require('../../models/Review');

    const recyclerId = req.user._id;

    const review = await Review.findOne({ _id: req.params.id, recyclerId })
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber deviceId');

    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Review not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Get Review By ID Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch review',
      error: error.message,
    });
  }
};

// @desc    Get review statistics
// @route   GET /api/recycler/reviews/stats
// @access  Private/Recycler
const getReviewStats = async (req, res) => {
  try {
    const Review = require('../../models/Review');
    const mongoose = require('mongoose');

    const recyclerId = req.user._id;

    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      {
        $match: {
          recyclerId: mongoose.Types.ObjectId(recyclerId),
          status: 'approved',
        },
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);

    // Get average rating
    const avgRatingData = await Review.aggregate([
      {
        $match: {
          recyclerId: mongoose.Types.ObjectId(recyclerId),
          status: 'approved',
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const averageRating = avgRatingData.length > 0 ? avgRatingData[0].averageRating : 0;
    const totalReviews = avgRatingData.length > 0 ? avgRatingData[0].totalReviews : 0;

    // Get recent reviews count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReviews = await Review.countDocuments({
      recyclerId,
      status: 'approved',
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        averageRating: averageRating.toFixed(1),
        totalReviews,
        recentReviews,
        ratingDistribution,
      },
    });
  } catch (error) {
    console.error('Get Review Stats Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch review statistics',
      error: error.message,
    });
  }
};

// @desc    Get reviews by rating
// @route   GET /api/recycler/reviews/rating/:rating
// @access  Private/Recycler
const getReviewsByRating = async (req, res) => {
  try {
    const Review = require('../../models/Review');

    const recyclerId = req.user._id;
    const { rating } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const reviews = await Review.find({ 
      recyclerId, 
      rating: parseInt(rating),
      status: 'approved',
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name')
      .select('rating comment createdAt');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error('Get Reviews By Rating Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch reviews by rating',
      error: error.message,
    });
  }
};

// @desc    Get recent reviews
// @route   GET /api/recycler/reviews/recent
// @access  Private/Recycler
const getRecentReviews = async (req, res) => {
  try {
    const Review = require('../../models/Review');

    const recyclerId = req.user._id;
    const limit = parseInt(req.query.limit) || 5;

    const reviews = await Review.find({ 
      recyclerId,
      status: 'approved',
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name')
      .select('rating comment createdAt');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error('Get Recent Reviews Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch recent reviews',
      error: error.message,
    });
  }
};

// @desc    Respond to review
// @route   POST /api/recycler/reviews/:id/respond
// @access  Private/Recycler
const respondToReview = async (req, res) => {
  try {
    const Review = require('../../models/Review');

    const recyclerId = req.user._id;
    const { response } = req.body;

    if (!response) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Response is required',
      });
    }

    const review = await Review.findOne({ _id: req.params.id, recyclerId });

    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Review not found',
      });
    }

    review.recyclerResponse = response;
    review.respondedAt = new Date();

    await review.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Response added successfully',
      data: review,
    });
  } catch (error) {
    console.error('Respond To Review Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to respond to review',
      error: error.message,
    });
  }
};

// @desc    Get rating breakdown
// @route   GET /api/recycler/reviews/breakdown
// @access  Private/Recycler
const getRatingBreakdown = async (req, res) => {
  try {
    const Review = require('../../models/Review');
    const mongoose = require('mongoose');

    const recyclerId = req.user._id;

    const breakdown = await Review.aggregate([
      {
        $match: {
          recyclerId: mongoose.Types.ObjectId(recyclerId),
          status: 'approved',
        },
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);

    // Get total
    const total = breakdown.reduce((sum, item) => sum + item.count, 0);

    // Format with percentages
    const formattedBreakdown = [5, 4, 3, 2, 1].map(rating => {
      const item = breakdown.find(b => b._id === rating);
      const count = item ? item.count : 0;
      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

      return {
        rating,
        count,
        percentage: parseFloat(percentage),
      };
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        total,
        breakdown: formattedBreakdown,
      },
    });
  } catch (error) {
    console.error('Get Rating Breakdown Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch rating breakdown',
      error: error.message,
    });
  }
};

module.exports = {
  getAllReviews,
  getReviewById,
  getReviewStats,
  getReviewsByRating,
  getRecentReviews,
  respondToReview,
  getRatingBreakdown,
};
