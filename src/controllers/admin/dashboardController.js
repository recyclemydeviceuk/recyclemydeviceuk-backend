// Admin dashboard stats
const { HTTP_STATUS } = require('../../config/constants');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const User = require('../../models/User');
    const Device = require('../../models/Device');
    const Recycler = require('../../models/Recycler');

    // Get current date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // Total counts
    const totalOrders = await Order.countDocuments();
    
    // Count unique customers from Orders (customers are stored inline in orders, not in User model)
    const uniqueCustomers = await Order.distinct('customerEmail');
    const totalUsers = uniqueCustomers.length;
    
    const totalRecyclers = await Recycler.countDocuments();
    const totalDevices = await Device.countDocuments();

    // Orders this month
    const ordersThisMonth = await Order.countDocuments({
      createdAt: { $gte: thisMonth },
    });

    // Orders last month
    const ordersLastMonth = await Order.countDocuments({
      createdAt: { $gte: lastMonth, $lt: thisMonth },
    });

    // Revenue calculation (using 'amount' field from Order model)
    const revenueResult = await Order.aggregate([
      { $match: { status: 'completed', paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = Math.floor(revenueResult[0]?.total || 0);

    // Revenue this month
    const revenueThisMonthResult = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          paymentStatus: 'paid',
          createdAt: { $gte: thisMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const revenueThisMonth = revenueThisMonthResult[0]?.total || 0;

    // Pending orders
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['pending', 'confirmed'] },
    });

    // Pending recyclers - check all recyclers first for debugging
    const allRecyclers = await Recycler.find({}, 'status companyName');
    console.log('Dashboard Stats Debug:');
    console.log('Total Recyclers:', totalRecyclers);
    console.log('All Recyclers with status:', allRecyclers.map(r => ({ name: r.companyName, status: r.status })));
    
    // Count pending recyclers
    const pendingRecyclers = await Recycler.countDocuments({
      status: 'pending',
    });
    console.log('Pending Recyclers Count:', pendingRecyclers);
    
    // Also try counting with different status values in case the field has different values
    const statusCounts = await Recycler.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('Recycler Status Breakdown:', statusCounts);

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('recyclerId', 'name')
      .populate('deviceId', 'name')
      .select('orderNumber customerName customerEmail status amount createdAt');

    // Order status breakdown
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    console.log('📤 Sending response with overview:', {
      totalOrders,
      totalUsers,
      totalRecyclers,
      totalDevices,
      totalRevenue,
      pendingOrders,
      pendingRecyclers,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        overview: {
          totalOrders,
          totalUsers,
          totalRecyclers,
          totalDevices,
          totalRevenue: Math.floor(totalRevenue),
          pendingOrders,
          pendingRecyclers,
        },
        trends: {
          ordersThisMonth,
          ordersLastMonth,
          revenueThisMonth,
          orderGrowth:
            ordersLastMonth > 0
              ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100
              : 0,
        },
        ordersByStatus,
        recentOrders,
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

// @desc    Get recent activity
// @route   GET /api/admin/dashboard/activity
// @access  Private/Admin
const getRecentActivity = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const User = require('../../models/User');
    const Recycler = require('../../models/Recycler');

    const limit = parseInt(req.query.limit) || 10;

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('deviceId', 'name')
      .select('orderNumber customerName customerEmail status createdAt');

    // Recent users
    const recentUsers = await User.find({ role: 'customer' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name email createdAt');

    // Recent recycler applications
    const recentRecyclers = await Recycler.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name email status createdAt');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        recentOrders,
        recentUsers,
        recentRecyclers,
      },
    });
  } catch (error) {
    console.error('Get Recent Activity Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch recent activity',
      error: error.message,
    });
  }
};

// @desc    Get revenue analytics
// @route   GET /api/admin/dashboard/revenue
// @access  Private/Admin
const getRevenueAnalytics = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const { period = 'month' } = req.query; // month, week, year

    let groupBy;
    let dateRange;

    const now = new Date();

    switch (period) {
      case 'week':
        dateRange = new Date(now.setDate(now.getDate() - 7));
        groupBy = { $dayOfMonth: '$createdAt' };
        break;
      case 'year':
        dateRange = new Date(now.getFullYear(), 0, 1);
        groupBy = { $month: '$createdAt' };
        break;
      case 'month':
      default:
        dateRange = new Date(now.getFullYear(), now.getMonth(), 1);
        groupBy = { $dayOfMonth: '$createdAt' };
    }

    const revenueData = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          paymentStatus: 'paid',
          createdAt: { $gte: dateRange },
        },
      },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$amount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        period,
        revenueData,
      },
    });
  } catch (error) {
    console.error('Get Revenue Analytics Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch revenue analytics',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getRevenueAnalytics,
};
