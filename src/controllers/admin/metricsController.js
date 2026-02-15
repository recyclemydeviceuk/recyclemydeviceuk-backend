// Recycler metrics/analytics
const { HTTP_STATUS } = require('../../config/constants');

// @desc    Get platform-wide metrics
// @route   GET /api/admin/metrics/platform
// @access  Private/Admin
const getPlatformMetrics = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const User = require('../../models/User');
    const Recycler = require('../../models/Recycler');
    const Device = require('../../models/Device');

    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Total counts
    const totalUsers = await User.countDocuments({ role: 'customer', ...dateFilter });
    const totalRecyclers = await Recycler.countDocuments(dateFilter);
    const totalOrders = await Order.countDocuments(dateFilter);
    const totalDevices = await Device.countDocuments();

    // Revenue metrics
    const revenueResult = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          paymentStatus: 'completed',
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' },
          avgOrderValue: { $avg: '$price' },
        },
      },
    ]);

    const { totalRevenue = 0, avgOrderValue = 0 } = revenueResult[0] || {};

    // Order completion rate
    const completedOrders = await Order.countDocuments({
      status: 'completed',
      ...dateFilter,
    });
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Top devices
    const topDevices = await Order.aggregate([
      { $match: { ...dateFilter } },
      { $group: { _id: '$phone.model', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Top recyclers
    const topRecyclers = await Order.aggregate([
      { $match: { status: 'completed', ...dateFilter } },
      {
        $group: {
          _id: '$recyclerId',
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
        },
      },
      { $sort: { orderCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'recyclers',
          localField: '_id',
          foreignField: '_id',
          as: 'recycler',
        },
      },
      { $unwind: '$recycler' },
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalRecyclers,
          totalOrders,
          totalDevices,
          totalRevenue,
          avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
          completionRate: parseFloat(completionRate.toFixed(2)),
        },
        topDevices,
        topRecyclers,
      },
    });
  } catch (error) {
    console.error('Get Platform Metrics Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch platform metrics',
      error: error.message,
    });
  }
};

// @desc    Get recycler performance metrics
// @route   GET /api/admin/metrics/recyclers
// @access  Private/Admin
const getRecyclerMetrics = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const Recycler = require('../../models/Recycler');

    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Recycler performance
    const recyclerPerformance = await Order.aggregate([
      { $match: { ...dateFilter } },
      {
        $group: {
          _id: '$recyclerId',
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$price', 0] },
          },
          avgPrice: { $avg: '$price' },
        },
      },
      {
        $lookup: {
          from: 'recyclers',
          localField: '_id',
          foreignField: '_id',
          as: 'recycler',
        },
      },
      { $unwind: '$recycler' },
      {
        $project: {
          recyclerId: '$_id',
          recyclerName: '$recycler.name',
          totalOrders: 1,
          completedOrders: 1,
          totalRevenue: 1,
          avgPrice: 1,
          completionRate: {
            $multiply: [{ $divide: ['$completedOrders', '$totalOrders'] }, 100],
          },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // Active vs inactive recyclers
    const activeRecyclers = await Recycler.countDocuments({ status: 'active' });
    const suspendedRecyclers = await Recycler.countDocuments({ status: 'suspended' });
    const pendingRecyclers = await Recycler.countDocuments({ status: 'pending' });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        recyclerPerformance,
        recyclerStats: {
          active: activeRecyclers,
          suspended: suspendedRecyclers,
          pending: pendingRecyclers,
        },
      },
    });
  } catch (error) {
    console.error('Get Recycler Metrics Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch recycler metrics',
      error: error.message,
    });
  }
};

// @desc    Get order trends over time
// @route   GET /api/admin/metrics/trends
// @access  Private/Admin
const getOrderTrends = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const { period = 'month' } = req.query; // day, week, month, year

    let groupBy;
    let dateRange;
    const now = new Date();

    switch (period) {
      case 'day':
        dateRange = new Date(now.setDate(now.getDate() - 30));
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        };
        break;
      case 'week':
        dateRange = new Date(now.setDate(now.getDate() - 90));
        groupBy = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' },
        };
        break;
      case 'year':
        dateRange = new Date(now.getFullYear() - 5, 0, 1);
        groupBy = { year: { $year: '$createdAt' } };
        break;
      case 'month':
      default:
        dateRange = new Date(now.getFullYear(), 0, 1);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        };
    }

    const trends = await Order.aggregate([
      { $match: { createdAt: { $gte: dateRange } } },
      {
        $group: {
          _id: groupBy,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$price', 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        period,
        trends,
      },
    });
  } catch (error) {
    console.error('Get Order Trends Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch order trends',
      error: error.message,
    });
  }
};

// @desc    Get device category metrics
// @route   GET /api/admin/metrics/devices
// @access  Private/Admin
const getDeviceMetrics = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const Device = require('../../models/Device');

    // Orders by device brand
    const ordersByBrand = await Order.aggregate([
      { $group: { _id: '$phone.brand', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Orders by device condition
    const ordersByCondition = await Order.aggregate([
      { $group: { _id: '$phone.condition', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Orders by storage capacity
    const ordersByStorage = await Order.aggregate([
      { $group: { _id: '$phone.storage', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Average price by device brand
    const avgPriceByBrand = await Order.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$phone.brand',
          avgPrice: { $avg: '$price' },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgPrice: -1 } },
    ]);

    // Total devices in catalog
    const totalDevices = await Device.countDocuments();
    const devicesByCategory = await Device.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        ordersByBrand,
        ordersByCondition,
        ordersByStorage,
        avgPriceByBrand,
        catalog: {
          totalDevices,
          devicesByCategory,
        },
      },
    });
  } catch (error) {
    console.error('Get Device Metrics Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch device metrics',
      error: error.message,
    });
  }
};

// @desc    Get customer behavior metrics
// @route   GET /api/admin/metrics/customers
// @access  Private/Admin
const getCustomerMetrics = async (req, res) => {
  try {
    const User = require('../../models/User');
    const Order = require('../../models/Order');

    // New customers over time
    const customerGrowth = await User.aggregate([
      { $match: { role: 'customer' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Repeat customers
    const repeatCustomers = await Order.aggregate([
      { $group: { _id: '$userId', orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $gt: 1 } } },
      { $count: 'repeatCustomers' },
    ]);

    // Average orders per customer
    const avgOrdersPerCustomer = await Order.aggregate([
      { $group: { _id: '$userId', orderCount: { $sum: 1 } } },
      { $group: { _id: null, avgOrders: { $avg: '$orderCount' } } },
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        customerGrowth,
        repeatCustomers: repeatCustomers[0]?.repeatCustomers || 0,
        avgOrdersPerCustomer: avgOrdersPerCustomer[0]?.avgOrders || 0,
      },
    });
  } catch (error) {
    console.error('Get Customer Metrics Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch customer metrics',
      error: error.message,
    });
  }
};

module.exports = {
  getPlatformMetrics,
  getRecyclerMetrics,
  getOrderTrends,
  getDeviceMetrics,
  getCustomerMetrics,
};
