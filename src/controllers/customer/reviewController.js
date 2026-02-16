// Submit reviews (after order completion, no account needed)
// Reviews linked to order number, not user account
const { HTTP_STATUS } = require('../../config/constants');

// @desc    Submit review for completed order
// @route   POST /api/customer/reviews
// @access  Public
const submitReview = async (req, res) => {
  try {
    const Review = require('../../models/Review');
    const Order = require('../../models/Order');

    const {
      orderNumber,
      email,
      rating,
      comment,
      customerName,
    } = req.body;

    // Validation
    if (!orderNumber || !email || !rating) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Order number, email, and rating are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Verify order exists and belongs to this email
    const order = await Order.findOne({ 
      orderNumber, 
      customerEmail: email 
    });

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found or email does not match',
      });
    }

    // Check if order is completed
    if (order.status !== 'completed') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Reviews can only be submitted for completed orders',
      });
    }

    // Check if review already exists for this order
    const existingReview = await Review.findOne({ orderId: order._id });

    if (existingReview) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Review already submitted for this order',
      });
    }

    // Create review
    const review = await Review.create({
      orderId: order._id,
      recyclerId: order.recyclerId,
      customerName: customerName || order.customerName,
      customerEmail: email,
      rating,
      comment,
      status: 'pending',
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Review submitted successfully and is pending approval',
      data: {
        reviewId: review._id,
        rating: review.rating,
        status: review.status,
      },
    });
  } catch (error) {
    console.error('Submit Review Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message,
    });
  }
};

// @desc    Get reviews for a recycler (public, approved only)
// @route   GET /api/customer/reviews/recycler/:recyclerId
// @access  Public
const getRecyclerReviews = async (req, res) => {
  try {
    const Review = require('../../models/Review');
    const mongoose = require('mongoose');

    const { recyclerId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Convert string to ObjectId for proper matching
    const recyclerObjectId = new mongoose.Types.ObjectId(recyclerId);

    const [reviews, total] = await Promise.all([
      Review.find({ 
        recyclerId: recyclerObjectId, 
        status: 'approved' 
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('customerName rating comment status createdAt recyclerResponse'),
      Review.countDocuments({ recyclerId: recyclerObjectId, status: 'approved' }),
    ]);

    // Calculate average rating
    const ratingData = await Review.aggregate([
      {
        $match: {
          recyclerId: recyclerObjectId,
          status: 'approved',
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
        },
      },
    ]);

    const averageRating = ratingData.length > 0 ? ratingData[0].averageRating : 0;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        reviews,
        averageRating: averageRating.toFixed(1),
        totalReviews: total,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get Recycler Reviews Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message,
    });
  }
};

// @desc    Get review statistics for recycler
// @route   GET /api/customer/reviews/recycler/:recyclerId/stats
// @access  Public
const getRecyclerReviewStats = async (req, res) => {
  try {
    const Review = require('../../models/Review');
    const mongoose = require('mongoose');

    const { recyclerId } = req.params;

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

    // Get average rating and total
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

    // Format distribution with percentages
    const total = ratingDistribution.reduce((sum, item) => sum + item.count, 0);
    const formattedBreakdown = [5, 4, 3, 2, 1].map(rating => {
      const item = ratingDistribution.find(b => b._id === rating);
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
        averageRating: averageRating.toFixed(1),
        totalReviews,
        ratingDistribution: formattedBreakdown,
      },
    });
  } catch (error) {
    console.error('Get Recycler Review Stats Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch review statistics',
      error: error.message,
    });
  }
};

// @desc    Check if order is eligible for review
// @route   POST /api/customer/reviews/check-eligibility
// @access  Public
const checkReviewEligibility = async (req, res) => {
  try {
    const Review = require('../../models/Review');
    const Order = require('../../models/Order');

    const { orderNumber, email } = req.body;

    if (!orderNumber || !email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Order number and email are required',
      });
    }

    // Find order
    const order = await Order.findOne({ 
      orderNumber, 
      customerEmail: email 
    });

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        eligible: false,
        message: 'Order not found',
      });
    }

    // Check if completed
    if (order.status !== 'completed') {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        eligible: false,
        message: 'Order must be completed to leave a review',
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ orderId: order._id });

    if (existingReview) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        eligible: false,
        message: 'Review already submitted for this order',
        review: {
          rating: existingReview.rating,
          status: existingReview.status,
        },
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      eligible: true,
      message: 'Order is eligible for review',
      order: {
        orderNumber: order.orderNumber,
        deviceName: order.deviceId?.name,
      },
    });
  } catch (error) {
    console.error('Check Review Eligibility Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to check eligibility',
      error: error.message,
    });
  }
};

module.exports = {
  submitReview,
  getRecyclerReviews,
  getRecyclerReviewStats,
  checkReviewEligibility,
};
