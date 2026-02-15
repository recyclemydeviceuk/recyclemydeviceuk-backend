// Reviews management
const { HTTP_STATUS, PAGINATION } = require('../../config/constants');

// @desc    Get all reviews
// @route   GET /api/admin/reviews
// @access  Private/Admin
const getAllReviews = async (req, res) => {
  try {
    const Review = require('../../models/Review');

    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const { rating, status, search } = req.query;

    // Build filter
    const filter = {};
    if (rating) filter.rating = parseInt(rating);
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { comment: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
      ];
    }

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .populate('recyclerId', 'name')
      .populate('orderId', 'orderId');

    const total = await Review.countDocuments(filter);

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
// @route   GET /api/admin/reviews/:id
// @access  Private/Admin
const getReviewById = async (req, res) => {
  try {
    const Review = require('../../models/Review');

    const review = await Review.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('recyclerId', 'name email')
      .populate('orderId', 'orderId phone.model price');

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

// @desc    Approve review
// @route   PATCH /api/admin/reviews/:id/approve
// @access  Private/Admin
const approveReview = async (req, res) => {
  try {
    const Review = require('../../models/Review');

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved', 
        approvedAt: new Date(),
        approvedBy: req.user._id,
      },
      { new: true }
    );

    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Review not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Review approved successfully',
      data: review,
    });
  } catch (error) {
    console.error('Approve Review Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to approve review',
      error: error.message,
    });
  }
};

// @desc    Reject review
// @route   PATCH /api/admin/reviews/:id/reject
// @access  Private/Admin
const rejectReview = async (req, res) => {
  try {
    const Review = require('../../models/Review');
    const { reason } = req.body;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: req.user._id,
        rejectionReason: reason,
      },
      { new: true }
    );

    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Review not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Review rejected successfully',
      data: review,
    });
  } catch (error) {
    console.error('Reject Review Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to reject review',
      error: error.message,
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
const deleteReview = async (req, res) => {
  try {
    const Review = require('../../models/Review');

    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Review not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete Review Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message,
    });
  }
};

// @desc    Bulk delete reviews
// @route   POST /api/admin/reviews/bulk-delete
// @access  Private/Admin
const bulkDeleteReviews = async (req, res) => {
  try {
    const Review = require('../../models/Review');
    const { reviewIds } = req.body;

    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Review IDs are required',
      });
    }

    const result = await Review.deleteMany({ _id: { $in: reviewIds } });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `${result.deletedCount} reviews deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Bulk Delete Reviews Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete reviews',
      error: error.message,
    });
  }
};

// @desc    Get review statistics
// @route   GET /api/admin/reviews/stats
// @access  Private/Admin
const getReviewStats = async (req, res) => {
  try {
    const Review = require('../../models/Review');

    const totalReviews = await Review.countDocuments();
    const approvedReviews = await Review.countDocuments({ status: 'approved' });
    const pendingReviews = await Review.countDocuments({ status: 'pending' });
    const rejectedReviews = await Review.countDocuments({ status: 'rejected' });

    // Average rating
    const avgRatingResult = await Review.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);
    const averageRating = avgRatingResult[0]?.avgRating || 0;

    // Rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        totalReviews,
        approvedReviews,
        pendingReviews,
        rejectedReviews,
        averageRating: parseFloat(averageRating.toFixed(2)),
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

// @desc    Flag review as inappropriate
// @route   PATCH /api/admin/reviews/:id/flag
// @access  Private/Admin
const flagReview = async (req, res) => {
  try {
    const Review = require('../../models/Review');
    const { reason } = req.body;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { 
        isFlagged: true,
        flaggedAt: new Date(),
        flaggedBy: req.user._id,
        flagReason: reason,
      },
      { new: true }
    );

    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Review not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Review flagged successfully',
      data: review,
    });
  } catch (error) {
    console.error('Flag Review Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to flag review',
      error: error.message,
    });
  }
};

module.exports = {
  getAllReviews,
  getReviewById,
  approveReview,
  rejectReview,
  deleteReview,
  bulkDeleteReviews,
  getReviewStats,
  flagReview,
};
