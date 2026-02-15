// Brands, conditions, statuses
const { HTTP_STATUS, DEVICE_BRANDS, DEVICE_CONDITIONS, DEVICE_CATEGORIES, ORDER_STATUS, PAYMENT_STATUS, RECYCLER_STATUS } = require('../../config/constants');

// ===== BRANDS MANAGEMENT =====

// @desc    Get all brands
// @route   GET /api/admin/utilities/brands
// @access  Private/Admin
const getAllBrands = async (req, res) => {
  try {
    const Brand = require('../../models/Brand');

    const brands = await Brand.find().sort({ name: 1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: brands.length > 0 ? brands : Object.entries(DEVICE_BRANDS).map(([key, value]) => ({ name: value })),
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

// @desc    Create brand
// @route   POST /api/admin/utilities/brands
// @access  Private/Admin
const createBrand = async (req, res) => {
  try {
    const Brand = require('../../models/Brand');
    const { name, logo } = req.body;

    if (!name) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Brand name is required',
      });
    }

    const brand = await Brand.create({ name, logo });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Brand created successfully',
      data: brand,
    });
  } catch (error) {
    console.error('Create Brand Error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Failed to create brand',
      error: error.message,
    });
  }
};

// @desc    Update brand
// @route   PUT /api/admin/utilities/brands/:id
// @access  Private/Admin
const updateBrand = async (req, res) => {
  try {
    const Brand = require('../../models/Brand');

    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!brand) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Brand not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Brand updated successfully',
      data: brand,
    });
  } catch (error) {
    console.error('Update Brand Error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Failed to update brand',
      error: error.message,
    });
  }
};

// @desc    Delete brand
// @route   DELETE /api/admin/utilities/brands/:id
// @access  Private/Admin
const deleteBrand = async (req, res) => {
  try {
    const Brand = require('../../models/Brand');

    const brand = await Brand.findByIdAndDelete(req.params.id);

    if (!brand) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Brand not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Brand deleted successfully',
    });
  } catch (error) {
    console.error('Delete Brand Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete brand',
      error: error.message,
    });
  }
};

// ===== CONSTANTS =====

// @desc    Get all device conditions
// @route   GET /api/admin/utilities/conditions
// @access  Private/Admin
const getDeviceConditions = async (req, res) => {
  try {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: DEVICE_CONDITIONS,
    });
  } catch (error) {
    console.error('Get Device Conditions Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch device conditions',
      error: error.message,
    });
  }
};

// @desc    Get all device categories
// @route   GET /api/admin/utilities/categories
// @access  Private/Admin
const getDeviceCategories = async (req, res) => {
  try {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: DEVICE_CATEGORIES,
    });
  } catch (error) {
    console.error('Get Device Categories Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch device categories',
      error: error.message,
    });
  }
};

// @desc    Get all order statuses
// @route   GET /api/admin/utilities/order-statuses
// @access  Private/Admin
const getOrderStatuses = async (req, res) => {
  try {
    const OrderStatus = require('../../models/OrderStatus');
    
    const statuses = await OrderStatus.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .select('name label description color emailMessage nextSteps order isDefault');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: statuses,
    });
  } catch (error) {
    console.error('Get Order Statuses Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch order statuses',
      error: error.message,
    });
  }
};

// @desc    Get all payment statuses
// @route   GET /api/admin/utilities/payment-statuses
// @access  Private/Admin
const getPaymentStatuses = async (req, res) => {
  try {
    const PaymentStatus = require('../../models/PaymentStatus');
    
    const statuses = await PaymentStatus.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .select('name label description color emailMessage order isDefault');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: statuses,
    });
  } catch (error) {
    console.error('Get Payment Statuses Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch payment statuses',
      error: error.message,
    });
  }
};

// @desc    Get all recycler statuses
// @route   GET /api/admin/utilities/recycler-statuses
// @access  Private/Admin
const getRecyclerStatuses = async (req, res) => {
  try {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: RECYCLER_STATUS,
    });
  } catch (error) {
    console.error('Get Recycler Statuses Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch recycler statuses',
      error: error.message,
    });
  }
};

// ===== SYSTEM SETTINGS =====

// @desc    Get system settings
// @route   GET /api/admin/utilities/settings
// @access  Private/Admin
const getSystemSettings = async (req, res) => {
  try {
    const Settings = require('../../models/Settings');

    let settings = await Settings.findOne();

    if (!settings) {
      // Create default settings
      settings = await Settings.create({
        siteName: 'Recycle My Device',
        siteDescription: 'Sell your old devices and get paid instantly',
        contactEmail: 'support@recyclemydevice.com',
        supportPhone: '+44 20 1234 5678',
        currency: 'GBP',
        enableNotifications: true,
        maintenanceMode: false,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get System Settings Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch system settings',
      error: error.message,
    });
  }
};

// @desc    Update system settings
// @route   PUT /api/admin/utilities/settings
// @access  Private/Admin
const updateSystemSettings = async (req, res) => {
  try {
    const Settings = require('../../models/Settings');

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      settings = await Settings.findOneAndUpdate({}, req.body, {
        new: true,
        runValidators: true,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'System settings updated successfully',
      data: settings,
    });
  } catch (error) {
    console.error('Update System Settings Error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Failed to update system settings',
      error: error.message,
    });
  }
};

// ===== STORAGE OPTIONS =====

// @desc    Get all storage options
// @route   GET /api/admin/utilities/storage-options
// @access  Private/Admin
const getStorageOptions = async (req, res) => {
  try {
    const storageOptions = ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB'];

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: storageOptions,
    });
  } catch (error) {
    console.error('Get Storage Options Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch storage options',
      error: error.message,
    });
  }
};

// ===== PRICE RANGES =====

// @desc    Get price range filters
// @route   GET /api/admin/utilities/price-ranges
// @access  Private/Admin
const getPriceRanges = async (req, res) => {
  try {
    const priceRanges = [
      { label: 'Under £100', min: 0, max: 100 },
      { label: '£100 - £300', min: 100, max: 300 },
      { label: '£300 - £500', min: 300, max: 500 },
      { label: '£500 - £1000', min: 500, max: 1000 },
      { label: 'Over £1000', min: 1000, max: null },
    ];

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: priceRanges,
    });
  } catch (error) {
    console.error('Get Price Ranges Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch price ranges',
      error: error.message,
    });
  }
};

// ===== ORDER STATUS MANAGEMENT =====

// @desc    Create order status
// @route   POST /api/admin/utilities/order-statuses
// @access  Private/Admin
const createOrderStatus = async (req, res) => {
  try {
    const OrderStatus = require('../../models/OrderStatus');
    const { name, label, description, color, emailMessage, nextSteps, order } = req.body;

    if (!name || !label) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Name and label are required',
      });
    }

    const status = await OrderStatus.create({
      name: name.toLowerCase().trim(),
      label,
      description,
      color: color || '#6B7280',
      emailMessage,
      nextSteps,
      order: order || 0,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Order status created successfully',
      data: status,
    });
  } catch (error) {
    console.error('Create Order Status Error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Failed to create order status',
      error: error.message,
    });
  }
};

// @desc    Update order status
// @route   PUT /api/admin/utilities/order-statuses/:id
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const OrderStatus = require('../../models/OrderStatus');
    const { name, ...updateData } = req.body;

    // Prevent updating name of default statuses
    const existingStatus = await OrderStatus.findById(req.params.id);
    if (!existingStatus) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order status not found',
      });
    }

    if (name && name !== existingStatus.name) {
      updateData.name = name.toLowerCase().trim();
    }

    const status = await OrderStatus.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Order status updated successfully',
      data: status,
    });
  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
    });
  }
};

// @desc    Delete order status
// @route   DELETE /api/admin/utilities/order-statuses/:id
// @access  Private/Admin
const deleteOrderStatus = async (req, res) => {
  try {
    const OrderStatus = require('../../models/OrderStatus');
    const Order = require('../../models/Order');

    const status = await OrderStatus.findById(req.params.id);
    if (!status) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order status not found',
      });
    }

    // Prevent deletion if status is in use
    const ordersUsingStatus = await Order.countDocuments({ status: status.name });
    if (ordersUsingStatus > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Cannot delete status. ${ordersUsingStatus} orders are using this status.`,
      });
    }

    // Prevent deletion of default statuses
    if (status.isDefault) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Cannot delete default status',
      });
    }

    await OrderStatus.findByIdAndDelete(req.params.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Order status deleted successfully',
    });
  } catch (error) {
    console.error('Delete Order Status Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete order status',
      error: error.message,
    });
  }
};

// ===== PAYMENT STATUS MANAGEMENT =====

// @desc    Create payment status
// @route   POST /api/admin/utilities/payment-statuses
// @access  Private/Admin
const createPaymentStatus = async (req, res) => {
  try {
    const PaymentStatus = require('../../models/PaymentStatus');
    const { name, label, description, color, emailMessage, order } = req.body;

    if (!name || !label) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Name and label are required',
      });
    }

    const status = await PaymentStatus.create({
      name: name.toLowerCase().trim(),
      label,
      description,
      color: color || '#6B7280',
      emailMessage,
      order: order || 0,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Payment status created successfully',
      data: status,
    });
  } catch (error) {
    console.error('Create Payment Status Error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Failed to create payment status',
      error: error.message,
    });
  }
};

// @desc    Update payment status
// @route   PUT /api/admin/utilities/payment-statuses/:id
// @access  Private/Admin
const updatePaymentStatus = async (req, res) => {
  try {
    const PaymentStatus = require('../../models/PaymentStatus');
    const { name, ...updateData } = req.body;

    const existingStatus = await PaymentStatus.findById(req.params.id);
    if (!existingStatus) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Payment status not found',
      });
    }

    if (name && name !== existingStatus.name) {
      updateData.name = name.toLowerCase().trim();
    }

    const status = await PaymentStatus.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Payment status updated successfully',
      data: status,
    });
  } catch (error) {
    console.error('Update Payment Status Error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message,
    });
  }
};

// @desc    Delete payment status
// @route   DELETE /api/admin/utilities/payment-statuses/:id
// @access  Private/Admin
const deletePaymentStatus = async (req, res) => {
  try {
    const PaymentStatus = require('../../models/PaymentStatus');
    const Order = require('../../models/Order');

    const status = await PaymentStatus.findById(req.params.id);
    if (!status) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Payment status not found',
      });
    }

    // Prevent deletion if status is in use
    const ordersUsingStatus = await Order.countDocuments({ paymentStatus: status.name });
    if (ordersUsingStatus > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Cannot delete status. ${ordersUsingStatus} orders are using this status.`,
      });
    }

    // Prevent deletion of default statuses
    if (status.isDefault) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Cannot delete default status',
      });
    }

    await PaymentStatus.findByIdAndDelete(req.params.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Payment status deleted successfully',
    });
  } catch (error) {
    console.error('Delete Payment Status Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete payment status',
      error: error.message,
    });
  }
};

// ===== DATA CLEANUP =====

// @desc    Clean up old data
// @route   POST /api/admin/utilities/cleanup
// @access  Private/Admin
const cleanupOldData = async (req, res) => {
  try {
    const { dataType, olderThanDays } = req.body;

    if (!dataType || !olderThanDays) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Data type and olderThanDays are required',
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let deletedCount = 0;

    switch (dataType) {
      case 'orders':
        const Order = require('../../models/Order');
        const orderResult = await Order.deleteMany({
          status: 'cancelled',
          createdAt: { $lt: cutoffDate },
        });
        deletedCount = orderResult.deletedCount;
        break;

      case 'contacts':
        const Contact = require('../../models/Contact');
        const contactResult = await Contact.deleteMany({
          status: 'replied',
          createdAt: { $lt: cutoffDate },
        });
        deletedCount = contactResult.deletedCount;
        break;

      default:
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid data type',
        });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Cleanup completed. ${deletedCount} records deleted.`,
      deletedCount,
    });
  } catch (error) {
    console.error('Cleanup Old Data Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to cleanup data',
      error: error.message,
    });
  }
};

module.exports = {
  // Brands
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  // Constants
  getDeviceConditions,
  getDeviceCategories,
  getOrderStatuses,
  getPaymentStatuses,
  getRecyclerStatuses,
  // System Settings
  getSystemSettings,
  updateSystemSettings,
  // Storage Options
  getStorageOptions,
  // Price Ranges
  getPriceRanges,
  // Order Statuses
  createOrderStatus,
  updateOrderStatus,
  deleteOrderStatus,
  // Payment Statuses
  createPaymentStatus,
  updatePaymentStatus,
  deletePaymentStatus,
  // Data Cleanup
  cleanupOldData,
};
