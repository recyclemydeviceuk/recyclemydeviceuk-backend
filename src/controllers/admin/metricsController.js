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
          paymentStatus: 'paid',
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

    const revenueData = revenueResult[0] || {};
    const totalRevenue = Math.floor(revenueData.totalRevenue || 0);
    const avgOrderValue = Math.floor(revenueData.avgOrderValue || 0);

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
          totalRevenue: Math.floor(totalRevenue),
          avgOrderValue: Math.floor(avgOrderValue),
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
    const User = require('../../models/User');
    const Review = require('../../models/Review');
    const { PAGINATION } = require('../../config/constants');

    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const { startDate, endDate, search, status } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get all recyclers with complete details
    const recyclerFilter = {};
    if (status && status !== 'all') {
      recyclerFilter.status = status === 'active' ? 'approved' : status;
    }

    const recyclers = await Recycler.find(recyclerFilter).lean();

    // Get detailed metrics for each recycler
    const recyclerMetrics = await Promise.all(
      recyclers.map(async (recycler) => {
        // Get orders for this recycler
        const orders = await Order.find({ 
          recyclerId: recycler._id,
          ...dateFilter 
        });

        // Calculate revenue from all orders (not just completed)
        const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
        
        // Count completed orders separately for device purchases
        const completedOrders = orders.filter(o => o.status === 'completed');
        
        // Use all orders for average price calculation
        const avgDevicePrice = orders.length > 0 ? totalRevenue / orders.length : 0;

        // Get unique customers by email
        const uniqueCustomers = new Set(orders.map(o => o.customerEmail).filter(Boolean));

        // Get brand distribution (simplified - would need device population)
        const topBrands = ['Various Devices'];

        // Calculate growth rate (mock for now - would need historical data)
        const growthRate = Math.random() * 30 - 10; // -10% to +20%

        // Get last purchase date
        const lastOrder = orders.length > 0 
          ? orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
          : null;

        // Calculate real average rating from approved reviews
        const reviews = await Review.find({ 
          recyclerId: recycler._id, 
          status: 'approved' 
        });
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const rating = reviews.length > 0 ? totalRating / reviews.length : 0;

        return {
          id: recycler._id.toString(),
          companyName: recycler.companyName,
          contactPerson: recycler.name,
          email: recycler.email,
          phone: recycler.phone,
          address: `${recycler.address || ''}, ${recycler.city || ''}, ${recycler.postcode || ''}`.trim(),
          status: recycler.status === 'approved' ? 'active' : 'inactive',
          totalCustomers: uniqueCustomers.size,
          totalDevicesPurchased: orders.length,
          totalSpent: Math.floor(totalRevenue),
          averageDevicePrice: Math.floor(avgDevicePrice),
          lastPurchaseDate: lastOrder ? lastOrder.createdAt : null,
          growthRate: Math.round(growthRate * 10) / 10,
          rating: rating > 0 ? Math.round(rating * 10) / 10 : 0,
          reviewCount: reviews.length,
          topBrands,
          businessStatus: recycler.status === 'approved' ? 'Currently accepting new orders' : 'Currently not accepting orders',
          businessActive: recycler.status === 'approved',
          logo: recycler.logo,
          description: recycler.businessDescription || '',
          sellingPoints: recycler.usps || [],
        };
      })
    );

    // Filter by search query
    let filteredMetrics = recyclerMetrics;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMetrics = recyclerMetrics.filter(r => 
        r.companyName.toLowerCase().includes(searchLower) ||
        r.contactPerson.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const totalMetrics = filteredMetrics.length;
    const paginatedMetrics = filteredMetrics.slice(skip, skip + limit);

    // Calculate overall stats (from all metrics, not just current page)
    const totalRevenue = filteredMetrics.reduce((sum, r) => sum + r.totalSpent, 0);
    const totalOrders = filteredMetrics.reduce((sum, r) => sum + r.totalDevicesPurchased, 0);
    const totalCustomers = filteredMetrics.reduce((sum, r) => sum + r.totalCustomers, 0);
    const avgRating = filteredMetrics.length > 0 
      ? filteredMetrics.reduce((sum, r) => sum + r.rating, 0) / filteredMetrics.length 
      : 0;

    // Active vs inactive recyclers
    const activeRecyclers = await Recycler.countDocuments({ status: 'approved' });
    const suspendedRecyclers = await Recycler.countDocuments({ status: 'suspended' });
    const pendingRecyclers = await Recycler.countDocuments({ status: 'pending' });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        metrics: paginatedMetrics,
        overview: {
          totalRevenue: Math.floor(totalRevenue),
          totalOrders,
          totalCustomers,
          averageRating: Math.round(avgRating * 10) / 10,
        },
        recyclerStats: {
          active: activeRecyclers,
          suspended: suspendedRecyclers,
          pending: pendingRecyclers,
          total: activeRecyclers + suspendedRecyclers + pendingRecyclers,
        },
      },
      pagination: {
        page,
        limit,
        total: totalMetrics,
        pages: Math.ceil(totalMetrics / limit),
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

    // Repeat customers (by email)
    const repeatCustomers = await Order.aggregate([
      { $group: { _id: '$customerEmail', orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $gt: 1 } } },
      { $count: 'repeatCustomers' },
    ]);

    // Average orders per customer
    const avgOrdersPerCustomer = await Order.aggregate([
      { $group: { _id: '$customerEmail', orderCount: { $sum: 1 } } },
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
