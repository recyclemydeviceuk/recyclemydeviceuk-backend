// Recycler profile
const bcrypt = require('bcryptjs');
const { HTTP_STATUS } = require('../../config/constants');

// @desc    Get recycler profile
// @route   GET /api/recycler/profile
// @access  Private/Recycler
const getProfile = async (req, res) => {
  try {
    const Recycler = require('../../models/Recycler');

    const recycler = await Recycler.findById(req.user._id).select('-password');

    if (!recycler) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recycler not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: recycler,
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
};

// @desc    Update recycler profile
// @route   PUT /api/recycler/profile
// @access  Private/Recycler
const updateProfile = async (req, res) => {
  try {
    const Recycler = require('../../models/Recycler');
    const { 
      name, 
      phone, 
      companyName, 
      website, 
      businessDescription,
      address,
      city,
      postcode,
      bankDetails,
      logo,
    } = req.body;

    const recycler = await Recycler.findById(req.user._id);

    if (!recycler) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recycler not found',
      });
    }

    // Update allowed fields
    if (name) recycler.name = name;
    if (phone) recycler.phone = phone;
    if (companyName) recycler.companyName = companyName;
    if (website) recycler.website = website;
    if (businessDescription) recycler.businessDescription = businessDescription;
    if (address) recycler.address = address;
    if (city) recycler.city = city;
    if (postcode) recycler.postcode = postcode;
    if (bankDetails) recycler.bankDetails = bankDetails;
    if (logo) recycler.logo = logo;

    await recycler.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: recycler._id,
        name: recycler.name,
        email: recycler.email,
        phone: recycler.phone,
        companyName: recycler.companyName,
        website: recycler.website,
        status: recycler.status,
      },
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

// @desc    Change password
// @route   PUT /api/recycler/profile/password
// @access  Private/Recycler
const changePassword = async (req, res) => {
  try {
    const Recycler = require('../../models/Recycler');
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    const recycler = await Recycler.findById(req.user._id);

    if (!recycler) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recycler not found',
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, recycler.password);

    if (!isPasswordValid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    recycler.password = hashedPassword;
    await recycler.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
};

// @desc    Update bank details
// @route   PUT /api/recycler/profile/bank-details
// @access  Private/Recycler
const updateBankDetails = async (req, res) => {
  try {
    const Recycler = require('../../models/Recycler');
    const { accountName, accountNumber, sortCode, bankName } = req.body;

    if (!accountName || !accountNumber || !sortCode) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Account name, account number, and sort code are required',
      });
    }

    const recycler = await Recycler.findById(req.user._id);

    if (!recycler) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recycler not found',
      });
    }

    recycler.bankDetails = {
      accountName,
      accountNumber,
      sortCode,
      bankName: bankName || '',
    };

    await recycler.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Bank details updated successfully',
    });
  } catch (error) {
    console.error('Update Bank Details Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update bank details',
      error: error.message,
    });
  }
};

// @desc    Get recycler statistics
// @route   GET /api/recycler/profile/stats
// @access  Private/Recycler
const getRecyclerStats = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const Review = require('../../models/Review');
    const mongoose = require('mongoose');

    const recyclerId = req.user._id;

    // Get order statistics
    const totalOrders = await Order.countDocuments({ recyclerId });
    const completedOrders = await Order.countDocuments({ 
      recyclerId, 
      status: 'completed' 
    });

    // Calculate total earnings
    const earnings = await Order.aggregate([
      { 
        $match: { 
          recyclerId: mongoose.Types.ObjectId(recyclerId),
          status: 'completed',
          paymentStatus: 'paid'
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' } 
        } 
      },
    ]);

    const totalEarnings = earnings.length > 0 ? earnings[0].total : 0;

    // Get average rating
    const ratingData = await Review.aggregate([
      {
        $match: {
          recyclerId: mongoose.Types.ObjectId(recyclerId),
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

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        totalEarnings,
        averageRating: averageRating.toFixed(1),
        totalReviews,
      },
    });
  } catch (error) {
    console.error('Get Recycler Stats Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
};

// @desc    Get account activity log
// @route   GET /api/recycler/profile/activity
// @access  Private/Recycler
const getActivityLog = async (req, res) => {
  try {
    const Order = require('../../models/Order');

    const recyclerId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;

    // Get recent orders as activity
    const recentActivity = await Order.find({ recyclerId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('deviceId', 'name brand')
      .select('orderNumber status amount createdAt updatedAt');

    const activities = recentActivity.map(order => ({
      id: order._id,
      type: 'order',
      action: `Order ${order.status}`,
      description: `${order.deviceId?.brand} ${order.deviceId?.name} - £${order.amount}`,
      orderNumber: order.orderNumber,
      timestamp: order.updatedAt || order.createdAt,
    }));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error('Get Activity Log Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch activity log',
      error: error.message,
    });
  }
};

// @desc    Update business hours
// @route   PUT /api/recycler/profile/business-hours
// @access  Private/Recycler
const updateBusinessHours = async (req, res) => {
  try {
    const Recycler = require('../../models/Recycler');
    const { businessHours } = req.body;

    if (!businessHours) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Business hours are required',
      });
    }

    const recycler = await Recycler.findById(req.user._id);

    if (!recycler) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recycler not found',
      });
    }

    recycler.businessHours = businessHours;
    await recycler.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Business hours updated successfully',
      data: recycler.businessHours,
    });
  } catch (error) {
    console.error('Update Business Hours Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update business hours',
      error: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updateBankDetails,
  getRecyclerStats,
  getActivityLog,
  updateBusinessHours,
};
