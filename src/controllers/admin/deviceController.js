// Device CRUD
const { HTTP_STATUS, PAGINATION } = require('../../config/constants');

// @desc    Get all devices
// @route   GET /api/admin/devices
// @access  Private/Admin
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
      ];
    }
    if (brand) filter.brand = brand;
    if (category) filter.category = category;
    if (status) filter.status = status;

    const devices = await Device.find(filter)
      .populate('brand', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Device.countDocuments(filter);

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
// @route   GET /api/admin/devices/:id
// @access  Private/Admin
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

// @desc    Create new device
// @route   POST /api/admin/devices
// @access  Private/Admin
const createDevice = async (req, res) => {
  try {
    const Device = require('../../models/Device');

    const device = await Device.create(req.body);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Device created successfully',
      data: device,
    });
  } catch (error) {
    console.error('Create Device Error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Failed to create device',
      error: error.message,
    });
  }
};

// @desc    Update device
// @route   PUT /api/admin/devices/:id
// @access  Private/Admin
const updateDevice = async (req, res) => {
  try {
    const Device = require('../../models/Device');

    const device = await Device.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!device) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Device not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Device updated successfully',
      data: device,
    });
  } catch (error) {
    console.error('Update Device Error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Failed to update device',
      error: error.message,
    });
  }
};

// @desc    Delete device
// @route   DELETE /api/admin/devices/:id
// @access  Private/Admin
const deleteDevice = async (req, res) => {
  try {
    const Device = require('../../models/Device');

    const device = await Device.findByIdAndDelete(req.params.id);

    if (!device) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Device not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Device deleted successfully',
    });
  } catch (error) {
    console.error('Delete Device Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete device',
      error: error.message,
    });
  }
};

// @desc    Bulk delete devices
// @route   POST /api/admin/devices/bulk-delete
// @access  Private/Admin
const bulkDeleteDevices = async (req, res) => {
  try {
    const Device = require('../../models/Device');
    const { deviceIds } = req.body;

    if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Device IDs are required',
      });
    }

    const result = await Device.deleteMany({ _id: { $in: deviceIds } });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `${result.deletedCount} devices deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Bulk Delete Devices Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete devices',
      error: error.message,
    });
  }
};

// @desc    Update device status
// @route   PATCH /api/admin/devices/:id/status
// @access  Private/Admin
const updateDeviceStatus = async (req, res) => {
  try {
    const Device = require('../../models/Device');
    const { status } = req.body;

    if (!status) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Status is required',
      });
    }

    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!device) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Device not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Device status updated successfully',
      data: device,
    });
  } catch (error) {
    console.error('Update Device Status Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update device status',
      error: error.message,
    });
  }
};

module.exports = {
  getAllDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  bulkDeleteDevices,
  updateDeviceStatus,
};
