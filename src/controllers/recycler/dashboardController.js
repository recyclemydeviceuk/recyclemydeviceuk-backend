// Recycler dashboard
const { HTTP_STATUS } = require('../../config/constants');

// @desc    Get recycler dashboard statistics
// @route   GET /api/recycler/dashboard/stats
// @access  Private/Recycler
const getDashboardStats = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const Review = require('../../models/Review');
    const mongoose = require('mongoose');

    const recyclerId = req.user.id || req.user._id;

    // Get total orders
    const totalOrders = await Order.countDocuments({ recyclerId });

    // Get orders by status
    const [pending, processing, completed, cancelled] = await Promise.all([
      Order.countDocuments({ recyclerId, status: 'pending' }),
      Order.countDocuments({ recyclerId, status: 'processing' }),
      Order.countDocuments({ recyclerId, status: 'completed' }),
      Order.countDocuments({ recyclerId, status: 'cancelled' }),
    ]);

    // Calculate revenue
    const revenueData = await Order.aggregate([
      {
        $match: {
          recyclerId: new mongoose.Types.ObjectId(recyclerId),
          status: 'completed',
          paymentStatus: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
        },
      },
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // Calculate pending revenue
    const pendingRevenueData = await Order.aggregate([
      {
        $match: {
          recyclerId: new mongoose.Types.ObjectId(recyclerId),
          status: { $in: ['pending', 'processing'] },
        },
      },
      {
        $group: {
          _id: null,
          pendingRevenue: { $sum: '$amount' },
        },
      },
    ]);

    const pendingRevenue = pendingRevenueData.length > 0 ? pendingRevenueData[0].pendingRevenue : 0;

    // Get average rating
    const ratingData = await Review.aggregate([
      {
        $match: {
          recyclerId: new mongoose.Types.ObjectId(recyclerId),
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

    const averageRating = ratingData.length > 0 ? ratingData[0].averageRating : 0;
    const totalReviews = ratingData.length > 0 ? ratingData[0].totalReviews : 0;

    // Get recent orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentOrders = await Order.countDocuments({
      recyclerId,
      createdAt: { $gte: sevenDaysAgo },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          pending,
          processing,
          completed,
          cancelled,
          recent: recentOrders,
        },
        revenue: {
          total: totalRevenue,
          pending: pendingRevenue,
        },
        rating: {
          average: averageRating.toFixed(1),
          total: totalReviews,
        },
      },
    });
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
};

// @desc    Get recent orders for dashboard
// @route   GET /api/recycler/dashboard/recent-orders
// @access  Private/Recycler
const getRecentOrders = async (req, res) => {
  try {
    const Order = require('../../models/Order');

    const recyclerId = req.user.id || req.user._id;
    const limit = parseInt(req.query.limit) || 5;

    const orders = await Order.find({ recyclerId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('deviceId', 'name brand model')
      .select('orderNumber customerName customerEmail status amount deviceCondition createdAt');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Get Recent Orders Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch recent orders',
      error: error.message,
    });
  }
};

// @desc    Get revenue chart data
// @route   GET /api/recycler/dashboard/revenue-chart
// @access  Private/Recycler
const getRevenueChart = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const mongoose = require('mongoose');

    const recyclerId = req.user.id || req.user._id;
    const { period = 'week' } = req.query; // week, month, year

    let groupBy;
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        };
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        };
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        };
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        };
    }

    const revenueData = await Order.aggregate([
      {
        $match: {
          recyclerId: new mongoose.Types.ObjectId(recyclerId),
          status: 'completed',
          paymentStatus: 'paid',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$amount' },
          orders: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: revenueData,
    });
  } catch (error) {
    console.error('Get Revenue Chart Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch revenue chart data',
      error: error.message,
    });
  }
};

// @desc    Get top devices by revenue
// @route   GET /api/recycler/dashboard/top-devices
// @access  Private/Recycler
const getTopDevices = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const mongoose = require('mongoose');

    const recyclerId = req.user.id || req.user._id;
    const limit = parseInt(req.query.limit) || 5;

    const topDevices = await Order.aggregate([
      {
        $match: {
          recyclerId: new mongoose.Types.ObjectId(recyclerId),
          status: 'completed',
        },
      },
      {
        $lookup: {
          from: 'devices',
          localField: 'deviceId',
          foreignField: '_id',
          as: 'device',
        },
      },
      {
        $unwind: '$device',
      },
      {
        $group: {
          _id: '$deviceId',
          deviceName: { $first: '$device.name' },
          deviceBrand: { $first: '$device.brand' },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: topDevices,
    });
  } catch (error) {
    console.error('Get Top Devices Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch top devices',
      error: error.message,
    });
  }
};

// @desc    Get performance metrics
// @route   GET /api/recycler/dashboard/performance
// @access  Private/Recycler
const getPerformanceMetrics = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const mongoose = require('mongoose');

    const recyclerId = req.user.id || req.user._id;

    // Calculate completion rate
    const totalOrders = await Order.countDocuments({ recyclerId });
    const completedOrders = await Order.countDocuments({ recyclerId, status: 'completed' });
    const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0;

    // Calculate average order value
    const avgOrderData = await Order.aggregate([
      {
        $match: {
          recyclerId: new mongoose.Types.ObjectId(recyclerId),
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          averageOrderValue: { $avg: '$amount' },
        },
      },
    ]);

    const averageOrderValue = avgOrderData.length > 0 ? avgOrderData[0].averageOrderValue : 0;

    // Calculate average processing time
    const processingTimeData = await Order.aggregate([
      {
        $match: {
          recyclerId: new mongoose.Types.ObjectId(recyclerId),
          status: 'completed',
          completedAt: { $exists: true },
        },
      },
      {
        $project: {
          processingTime: {
            $divide: [
              { $subtract: ['$completedAt', '$createdAt'] },
              1000 * 60 * 60 * 24, // Convert to days
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgProcessingTime: { $avg: '$processingTime' },
        },
      },
    ]);

    const avgProcessingTime = processingTimeData.length > 0 ? processingTimeData[0].avgProcessingTime.toFixed(1) : 0;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        completionRate: parseFloat(completionRate),
        averageOrderValue: averageOrderValue.toFixed(2),
        avgProcessingTime: parseFloat(avgProcessingTime),
        totalOrders,
        completedOrders,
      },
    });
  } catch (error) {
    console.error('Get Performance Metrics Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch performance metrics',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentOrders,
  getRevenueChart,
  getTopDevices,
  getPerformanceMetrics,
};
