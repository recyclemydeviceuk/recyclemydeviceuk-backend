// Devices accepted
const { HTTP_STATUS, PAGINATION } = require('../../config/constants');

// @desc    Get all devices
// @route   GET /api/recycler/devices
// @access  Private/Recycler
const getAllDevices = async (req, res) => {
  try {
    const Device = require('../../models/Device');

    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const { search, brand, category, status } = req.query;

    // Build filter
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
      ];
    }

    if (brand) filter.brand = brand;
    if (category) filter.category = category;
    if (status) filter.status = status;

    const [devices, total] = await Promise.all([
      Device.find(filter)
        .populate('brand', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('name brand category image storageOptions conditionOptions specifications status'),
      Device.countDocuments(filter),
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: devices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get All Devices Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch devices',
      error: error.message,
    });
  }
};

// @desc    Get device by ID
// @route   GET /api/recycler/devices/:id
// @access  Private/Recycler
const getDeviceById = async (req, res) => {
  try {
    const Device = require('../../models/Device');

    const device = await Device.findById(req.params.id).populate('brand', 'name');

    if (!device) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Device not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: device,
    });
  } catch (error) {
    console.error('Get Device By ID Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch device',
      error: error.message,
    });
  }
};

// @desc    Get devices by category
// @route   GET /api/recycler/devices/category/:category
// @access  Private/Recycler
const getDevicesByCategory = async (req, res) => {
  try {
    const Device = require('../../models/Device');

    const { category } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const devices = await Device.find({ category, status: 'active' })
      .populate('brand', 'name')
      .sort({ name: 1 })
      .limit(limit)
      .select('name brand category image');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: devices,
    });
  } catch (error) {
    console.error('Get Devices By Category Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch devices by category',
      error: error.message,
    });
  }
};

// @desc    Get popular devices (most ordered)
// @route   GET /api/recycler/devices/popular
// @access  Private/Recycler
const getPopularDevices = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const Device = require('../../models/Device');
    const mongoose = require('mongoose');

    const limit = parseInt(req.query.limit) || 10;

    // Get most ordered devices
    const popularDeviceIds = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'processing'] },
        },
      },
      {
        $group: {
          _id: '$deviceId',
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { orderCount: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    const deviceIds = popularDeviceIds.map((item) => item._id);

    const devices = await Device.find({ _id: { $in: deviceIds } })
      .populate('brand', 'name')
      .select('name brand category image');

    // Add order count to devices
    const devicesWithCount = devices.map((device) => {
      const orderData = popularDeviceIds.find(
        (item) => item._id.toString() === device._id.toString()
      );
      return {
        ...device.toObject(),
        orderCount: orderData ? orderData.orderCount : 0,
      };
    });

    // Sort by order count
    devicesWithCount.sort((a, b) => b.orderCount - a.orderCount);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: devicesWithCount,
    });
  } catch (error) {
    console.error('Get Popular Devices Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch popular devices',
      error: error.message,
    });
  }
};

// @desc    Search devices
// @route   GET /api/recycler/devices/search
// @access  Private/Recycler
const searchDevices = async (req, res) => {
  try {
    const Device = require('../../models/Device');

    const { query } = req.query;

    if (!query) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const devices = await Device.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
      ],
      status: 'active',
    })
      .populate('brand', 'name')
      .limit(20)
      .select('name brand category image');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: devices,
    });
  } catch (error) {
    console.error('Search Devices Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to search devices',
      error: error.message,
    });
  }
};

// @desc    Get device statistics for recycler
// @route   GET /api/recycler/devices/stats
// @access  Private/Recycler
const getDeviceStats = async (req, res) => {
  try {
    const Device = require('../../models/Device');
    const Order = require('../../models/Order');
    const mongoose = require('mongoose');

    const recyclerId = req.user._id;

    // Total devices available
    const totalDevices = await Device.countDocuments({ status: 'active' });

    // Devices recycler has processed
    const processedDevices = await Order.distinct('deviceId', {
      recyclerId,
      status: 'completed',
    });

    // Most profitable device for this recycler
    const mostProfitable = await Order.aggregate([
      {
        $match: {
          recyclerId: mongoose.Types.ObjectId(recyclerId),
          status: 'completed',
        },
      },
      {
        $group: {
          _id: '$deviceId',
          totalRevenue: { $sum: '$amount' },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: 1,
      },
      {
        $lookup: {
          from: 'devices',
          localField: '_id',
          foreignField: '_id',
          as: 'device',
        },
      },
      {
        $unwind: '$device',
      },
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        totalDevices,
        processedDevicesCount: processedDevices.length,
        mostProfitableDevice: mostProfitable.length > 0 ? mostProfitable[0] : null,
      },
    });
  } catch (error) {
    console.error('Get Device Stats Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch device statistics',
      error: error.message,
    });
  }
};

module.exports = {
  getAllDevices,
  getDeviceById,
  getDevicesByCategory,
  getPopularDevices,
  searchDevices,
  getDeviceStats,
};
