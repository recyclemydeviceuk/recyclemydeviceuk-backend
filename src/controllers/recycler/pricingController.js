// Recycler device pricing management
const { HTTP_STATUS, PAGINATION } = require('../../config/constants');
const RecyclerDevicePricing = require('../../models/RecyclerDevicePricing');
const Device = require('../../models/Device');

// @desc    Get all device pricing for a recycler
// @route   GET /api/recycler/pricing
// @access  Private/Recycler
const getAllPricing = async (req, res) => {
  try {
    const recyclerId = req.user._id;
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const { search, deviceId } = req.query;

    // Build filter
    const filter = { recyclerId };
    if (deviceId) filter.deviceId = deviceId;

    const [pricing, total] = await Promise.all([
      RecyclerDevicePricing.find(filter)
        .populate('deviceId', 'name brand category image storageOptions conditionOptions')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      RecyclerDevicePricing.countDocuments(filter),
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: pricing,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get All Pricing Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch pricing',
      error: error.message,
    });
  }
};

// @desc    Get pricing for a specific device
// @route   GET /api/recycler/pricing/device/:deviceId
// @access  Private/Recycler
const getPricingByDevice = async (req, res) => {
  try {
    const recyclerId = req.user._id;
    const { deviceId } = req.params;

    const pricing = await RecyclerDevicePricing.findOne({
      recyclerId,
      deviceId,
    }).populate('deviceId', 'name brand category image storageOptions conditionOptions');

    if (!pricing) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Pricing not found for this device',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: pricing,
    });
  } catch (error) {
    console.error('Get Pricing By Device Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch pricing',
      error: error.message,
    });
  }
};

// @desc    Create or update pricing for a device
// @route   POST /api/recycler/pricing
// @access  Private/Recycler
const createOrUpdatePricing = async (req, res) => {
  try {
    const recyclerId = req.user._id;
    const { deviceId, storagePricing, isActive } = req.body;

    if (!deviceId || !storagePricing || !Array.isArray(storagePricing)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Device ID and storage pricing are required',
      });
    }

    // Verify device exists
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Device not found',
      });
    }

    // Check if pricing already exists
    let pricing = await RecyclerDevicePricing.findOne({
      recyclerId,
      deviceId,
    });

    if (pricing) {
      // Update existing pricing
      pricing.storagePricing = storagePricing;
      pricing.isActive = isActive !== undefined ? isActive : pricing.isActive;
      await pricing.save();

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Pricing updated successfully',
        data: pricing,
      });
    } else {
      // Create new pricing
      pricing = await RecyclerDevicePricing.create({
        recyclerId,
        deviceId,
        storagePricing,
        isActive: isActive !== undefined ? isActive : true,
      });

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Pricing created successfully',
        data: pricing,
      });
    }
  } catch (error) {
    console.error('Create/Update Pricing Error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Failed to save pricing',
      error: error.message,
    });
  }
};

// @desc    Delete pricing for a device
// @route   DELETE /api/recycler/pricing/:id
// @access  Private/Recycler
const deletePricing = async (req, res) => {
  try {
    const recyclerId = req.user._id;
    const { id } = req.params;

    const pricing = await RecyclerDevicePricing.findOneAndDelete({
      _id: id,
      recyclerId,
    });

    if (!pricing) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Pricing not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Pricing deleted successfully',
    });
  } catch (error) {
    console.error('Delete Pricing Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete pricing',
      error: error.message,
    });
  }
};

// @desc    Get available devices (without pricing set by this recycler)
// @route   GET /api/recycler/pricing/available-devices
// @access  Private/Recycler
const getAvailableDevices = async (req, res) => {
  try {
    const recyclerId = req.user._id;

    // Get all device IDs that already have pricing for this recycler
    const existingPricing = await RecyclerDevicePricing.find({ recyclerId }).select('deviceId');
    const pricedDeviceIds = existingPricing.map(p => p.deviceId.toString());

    // Get devices that don't have pricing yet
    const availableDevices = await Device.find({
      _id: { $nin: pricedDeviceIds },
      status: 'active',
    }).select('name brand category image storageOptions conditionOptions');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: availableDevices,
    });
  } catch (error) {
    console.error('Get Available Devices Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch available devices',
      error: error.message,
    });
  }
};

module.exports = {
  getAllPricing,
  getPricingByDevice,
  createOrUpdatePricing,
  deletePricing,
  getAvailableDevices,
};
