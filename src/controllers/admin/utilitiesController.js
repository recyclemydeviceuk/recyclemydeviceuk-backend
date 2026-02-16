// Brands, conditions, statuses
const { HTTP_STATUS, DEVICE_BRANDS, DEVICE_CONDITIONS, DEVICE_CATEGORIES, ORDER_STATUS, PAYMENT_STATUS, RECYCLER_STATUS } = require('../../config/constants');
const { uploadToS3, deleteFromS3 } = require('../../config/aws');

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
    const { name } = req.body;

    console.log('Create Brand - Request body:', req.body);
    console.log('Create Brand - File:', req.file);

    if (!name || name.trim() === '') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Brand name is required',
      });
    }

    let logoUrl = null;
    let logoKey = null;

    // Upload logo image if provided
    if (req.file) {
      const uploadResult = await uploadToS3(req.file, 'brand-logos');
      logoUrl = uploadResult.url;
      logoKey = uploadResult.key;
    }

    const brand = await Brand.create({ 
      name, 
      logo: logoUrl,
      logoKey: logoKey 
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Brand created successfully',
      data: brand,
    });
  } catch (error) {
    console.error('Create Brand Error:', error);
    
    // Delete uploaded file if brand creation fails
    if (req.file && req.file.key) {
      await deleteFromS3(req.file.key).catch(err => console.error('Failed to delete uploaded file:', err));
    }
    
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
    const { name, deleteLogo } = req.body;

    console.log('Update Brand - Request body:', req.body);
    console.log('Update Brand - File:', req.file);
    console.log('Update Brand - Delete Logo:', deleteLogo);

    if (!name || name.trim() === '') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Brand name is required',
      });
    }

    const existingBrand = await Brand.findById(req.params.id);
    if (!existingBrand) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Brand not found',
      });
    }

    // If user wants to delete the logo
    if (deleteLogo === 'true') {
      // Delete old logo from S3 if exists
      if (existingBrand.logoKey) {
        await deleteFromS3(existingBrand.logoKey).catch(err => 
          console.error('Failed to delete logo from S3:', err)
        );
      }
      // Remove logo and logoKey from database using $unset
      const brand = await Brand.findByIdAndUpdate(
        req.params.id,
        { 
          $set: { name: name.trim() },
          $unset: { logo: 1, logoKey: 1 }
        },
        { new: true, runValidators: true }
      );

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Brand updated successfully',
        data: brand,
      });
    }
    
    const updateData = { name: name.trim() };

    // If new logo is uploaded
    if (req.file) {
      // Delete old logo from S3 if exists
      if (existingBrand.logoKey) {
        await deleteFromS3(existingBrand.logoKey).catch(err => 
          console.error('Failed to delete old logo:', err)
        );
      }

      // Upload new logo
      const uploadResult = await uploadToS3(req.file, 'brand-logos');
      updateData.logo = uploadResult.url;
      updateData.logoKey = uploadResult.key;
    }

    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Brand updated successfully',
      data: brand,
    });
  } catch (error) {
    console.error('Update Brand Error:', error);
    
    // Delete uploaded file if update fails
    if (req.file && req.file.key) {
      await deleteFromS3(req.file.key).catch(err => console.error('Failed to delete uploaded file:', err));
    }
    
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

    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Brand not found',
      });
    }

    // Delete logo from S3 if exists
    if (brand.logoKey) {
      await deleteFromS3(brand.logoKey).catch(err => 
        console.error('Failed to delete logo from S3:', err)
      );
    }

    await Brand.findByIdAndDelete(req.params.id);

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
    // Return conditions as array with proper formatting
    const conditions = Object.values(DEVICE_CONDITIONS).map(condition => 
      condition.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: conditions,
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
    // Return categories as array of objects with value and label
    const categories = Object.values(DEVICE_CATEGORIES).map(cat => ({
      value: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' '),
    }));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: categories,
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
// (Moved to bottom of file with enhanced category-based options)

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

// @desc    Upload image to S3
// @route   POST /api/admin/utilities/upload-image
// @access  Private/Admin
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No image file provided',
      });
    }

    // Upload to S3
    const uploadResult = await uploadToS3(req.file, 'device-images');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: uploadResult.url,
        key: uploadResult.key,
      },
    });
  } catch (error) {
    console.error('Upload Image Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message,
    });
  }
};

// ===== STORAGE OPTIONS CRUD =====

// @desc    Get all storage options
// @route   GET /api/admin/utilities/storage-options
// @access  Private/Admin
const getStorageOptions = async (req, res) => {
  try {
    const StorageOption = require('../../models/StorageOption');
    const options = await StorageOption.find().sort({ category: 1, name: 1 });
    res.status(HTTP_STATUS.OK).json({ success: true, data: options });
  } catch (error) {
    console.error('Get Storage Options Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch storage options',
      error: error.message,
    });
  }
};

const createStorageOption = async (req, res) => {
  try {
    const StorageOption = require('../../models/StorageOption');
    const option = await StorageOption.create(req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: option });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Failed to create storage option', error: error.message });
  }
};

const updateStorageOption = async (req, res) => {
  try {
    const StorageOption = require('../../models/StorageOption');
    const option = await StorageOption.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!option) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Storage option not found' });
    res.status(HTTP_STATUS.OK).json({ success: true, data: option });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Failed to update storage option', error: error.message });
  }
};

const deleteStorageOption = async (req, res) => {
  try {
    const StorageOption = require('../../models/StorageOption');
    const option = await StorageOption.findByIdAndDelete(req.params.id);
    if (!option) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Storage option not found' });
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Storage option deleted' });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to delete storage option', error: error.message });
  }
};

// ===== DEVICE CATEGORIES CRUD =====

const getAllDeviceCategories = async (req, res) => {
  try {
    const DeviceCategory = require('../../models/DeviceCategory');
    const categories = await DeviceCategory.find().sort({ order: 1, label: 1 });
    res.status(HTTP_STATUS.OK).json({ success: true, data: categories });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to fetch device categories', error: error.message });
  }
};

const createDeviceCategory = async (req, res) => {
  try {
    const DeviceCategory = require('../../models/DeviceCategory');
    const category = await DeviceCategory.create(req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: category });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Failed to create device category', error: error.message });
  }
};

const updateDeviceCategory = async (req, res) => {
  try {
    const DeviceCategory = require('../../models/DeviceCategory');
    const category = await DeviceCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Device category not found' });
    res.status(HTTP_STATUS.OK).json({ success: true, data: category });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Failed to update device category', error: error.message });
  }
};

const deleteDeviceCategory = async (req, res) => {
  try {
    const DeviceCategory = require('../../models/DeviceCategory');
    const category = await DeviceCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Device category not found' });
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Device category deleted' });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to delete device category', error: error.message });
  }
};

// ===== CONDITIONS CRUD =====

const getAllConditions = async (req, res) => {
  try {
    const Condition = require('../../models/Condition');
    const conditions = await Condition.find().sort({ order: 1, name: 1 });
    res.status(HTTP_STATUS.OK).json({ success: true, data: conditions });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to fetch conditions', error: error.message });
  }
};

const createCondition = async (req, res) => {
  try {
    const Condition = require('../../models/Condition');
    const condition = await Condition.create({ ...req.body, priceMultiplier: req.body.priceMultiplier || 0.5 });
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: condition });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Failed to create condition', error: error.message });
  }
};

const updateCondition = async (req, res) => {
  try {
    const Condition = require('../../models/Condition');
    const condition = await Condition.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!condition) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Condition not found' });
    res.status(HTTP_STATUS.OK).json({ success: true, data: condition });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Failed to update condition', error: error.message });
  }
};

const deleteCondition = async (req, res) => {
  try {
    const Condition = require('../../models/Condition');
    const condition = await Condition.findByIdAndDelete(req.params.id);
    if (!condition) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Condition not found' });
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Condition deleted' });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to delete condition', error: error.message });
  }
};

// ===== BLOG CATEGORIES CRUD =====

const getAllBlogCategories = async (req, res) => {
  try {
    const BlogCategory = require('../../models/BlogCategory');
    const categories = await BlogCategory.find().sort({ order: 1, name: 1 });
    res.status(HTTP_STATUS.OK).json({ success: true, data: categories });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to fetch blog categories', error: error.message });
  }
};

const createBlogCategory = async (req, res) => {
  try {
    const BlogCategory = require('../../models/BlogCategory');
    const category = await BlogCategory.create(req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: category });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Failed to create blog category', error: error.message });
  }
};

const updateBlogCategory = async (req, res) => {
  try {
    const BlogCategory = require('../../models/BlogCategory');
    const category = await BlogCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Blog category not found' });
    res.status(HTTP_STATUS.OK).json({ success: true, data: category });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Failed to update blog category', error: error.message });
  }
};

const deleteBlogCategory = async (req, res) => {
  try {
    const BlogCategory = require('../../models/BlogCategory');
    const category = await BlogCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Blog category not found' });
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Blog category deleted' });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to delete blog category', error: error.message });
  }
};

// ===== FAQ CATEGORIES CRUD =====

const getAllFAQCategories = async (req, res) => {
  try {
    const FAQCategory = require('../../models/FAQCategory');
    const categories = await FAQCategory.find().sort({ order: 1, name: 1 });
    res.status(HTTP_STATUS.OK).json({ success: true, data: categories });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to fetch FAQ categories', error: error.message });
  }
};

const createFAQCategory = async (req, res) => {
  try {
    const FAQCategory = require('../../models/FAQCategory');
    const category = await FAQCategory.create(req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: category });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Failed to create FAQ category', error: error.message });
  }
};

const updateFAQCategory = async (req, res) => {
  try {
    const FAQCategory = require('../../models/FAQCategory');
    const category = await FAQCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'FAQ category not found' });
    res.status(HTTP_STATUS.OK).json({ success: true, data: category });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Failed to update FAQ category', error: error.message });
  }
};

const deleteFAQCategory = async (req, res) => {
  try {
    const FAQCategory = require('../../models/FAQCategory');
    const category = await FAQCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'FAQ category not found' });
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'FAQ category deleted' });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to delete FAQ category', error: error.message });
  }
};

module.exports = {
  // Brands
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  // Image
  uploadImage,
  // Storage Options
  getStorageOptions,
  createStorageOption,
  updateStorageOption,
  deleteStorageOption,
  // Device Categories
  getAllDeviceCategories,
  createDeviceCategory,
  updateDeviceCategory,
  deleteDeviceCategory,
  // Conditions
  getAllConditions,
  createCondition,
  updateCondition,
  deleteCondition,
  // Blog Categories
  getAllBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  // FAQ Categories
  getAllFAQCategories,
  createFAQCategory,
  updateFAQCategory,
  deleteFAQCategory,
  // Constants (read-only)
  getDeviceConditions,
  getDeviceCategories,
  getOrderStatuses,
  getPaymentStatuses,
  getRecyclerStatuses,
  getPriceRanges,
  // Order Statuses
  createOrderStatus,
  updateOrderStatus,
  deleteOrderStatus,
  // Payment Statuses
  createPaymentStatus,
  updatePaymentStatus,
  deletePaymentStatus,
  // System
  getSystemSettings,
  updateSystemSettings,
  cleanupOldData,
};
