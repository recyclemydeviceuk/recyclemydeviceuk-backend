// Browse devices
const { HTTP_STATUS, PAGINATION } = require('../../config/constants');
const Brand = require('../../models/Brand');

// @desc    Get all devices (public)
// @route   GET /api/customer/devices
// @access  Public
const getAllDevices = async (req, res) => {
  try {
    const Device = require('../../models/Device');

    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const { search, brand, category, minPrice, maxPrice, sortBy } = req.query;

    // Build filter - only show active devices
    const filter = { status: 'active' };

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // If brand name is provided, look up the brand ObjectId
    if (brand) {
      const brandDoc = await Brand.findOne({ name: { $regex: brand, $options: 'i' } });
      if (brandDoc) {
        filter.brand = brandDoc._id;
      } else {
        // If brand not found, return empty result
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        });
      }
    }
    
    if (category) filter.category = category;

    // Build sort
    let sort = { createdAt: -1 };
    if (sortBy === 'name') sort = { name: 1 };
    if (sortBy === 'brand') sort = { brand: 1 };

    const [devices, total] = await Promise.all([
      Device.find(filter)
        .populate('brand', 'name')
        .sort(sort)
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
// @route   GET /api/customer/devices/:id
// @access  Public
const getDeviceById = async (req, res) => {
  try {
    const Device = require('../../models/Device');

    const device = await Device.findOne({ 
      _id: req.params.id, 
      status: 'active' 
    }).populate('brand', 'name');

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

// @desc    Search devices
// @route   GET /api/customer/devices/search
// @access  Public
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
        { brand: { $regex: query, $options: 'i' } },
        { model: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
      ],
      status: 'active',
    })
      .limit(20)
      .select('name brand model category image basePrice');

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

// @desc    Get devices by brand
// @route   GET /api/customer/devices/brand/:brand
// @access  Public
const getDevicesByBrand = async (req, res) => {
  try {
    const Device = require('../../models/Device');
    const { brand } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const devices = await Device.find({ 
      brand: { $regex: brand, $options: 'i' }, 
      status: 'active' 
    })
      .sort({ name: 1 })
      .limit(limit)
      .select('name brand model category image basePrice');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: devices,
    });
  } catch (error) {
    console.error('Get Devices By Brand Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch devices by brand',
      error: error.message,
    });
  }
};

// @desc    Get devices by category
// @route   GET /api/customer/devices/category/:category
// @access  Public
const getDevicesByCategory = async (req, res) => {
  try {
    const Device = require('../../models/Device');
    const { category } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const devices = await Device.find({ 
      category, 
      status: 'active' 
    })
      .sort({ name: 1 })
      .limit(limit)
      .select('name brand model category image basePrice');

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

// @desc    Get all brands
// @route   GET /api/customer/devices/brands
// @access  Public
const getAllBrands = async (req, res) => {
  try {
    const Brand = require('../../models/Brand');

    const brands = await Brand.find({ status: 'active' })
      .select('name')
      .sort({ name: 1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    console.error('Get All Brands Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch brands',
      error: error.message,
    });
  }
};

// @desc    Get all categories
// @route   GET /api/customer/devices/categories/all
// @access  Public
const getAllCategories = async (req, res) => {
  try {
    const Device = require('../../models/Device');

    const categories = await Device.distinct('category', { status: 'active' });

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

// @desc    Get popular devices
// @route   GET /api/customer/devices/popular
// @access  Public
const getPopularDevices = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const Device = require('../../models/Device');

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

    const devices = await Device.find({ 
      _id: { $in: deviceIds },
      status: 'active',
    }).select('name brand model image category basePrice');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: devices,
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

module.exports = {
  getAllDevices,
  getDeviceById,
  searchDevices,
  getDevicesByBrand,
  getDevicesByCategory,
  getAllBrands,
  getAllCategories,
  getPopularDevices,
};
