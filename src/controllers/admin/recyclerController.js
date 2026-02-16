// Recycler approval/management
const { HTTP_STATUS, PAGINATION, RECYCLER_STATUS } = require('../../config/constants');
const { sendEmail } = require('../../config/aws');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// @desc    Get all recyclers
// @route   GET /api/admin/recyclers
// @access  Private/Admin
const getAllRecyclers = async (req, res) => {
  try {
    const Recycler = require('../../models/Recycler');

    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const { status, search } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }

    const recyclers = await Recycler.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Recycler.countDocuments(filter);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: recyclers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get All Recyclers Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch recyclers',
      error: error.message,
    });
  }
};

// @desc    Get recycler by ID
// @route   GET /api/admin/recyclers/:id
// @access  Private/Admin
const getRecyclerById = async (req, res) => {
  try {
    const Recycler = require('../../models/Recycler');

    const recycler = await Recycler.findById(req.params.id);

    if (!recycler) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recycler not found',
      });
    }

    // Get recycler's orders count
    const Order = require('../../models/Order');
    const ordersCount = await Order.countDocuments({ recyclerId: req.params.id });
    const completedOrders = await Order.countDocuments({
      recyclerId: req.params.id,
      status: 'completed',
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        ...recycler.toObject(),
        stats: {
          totalOrders: ordersCount,
          completedOrders,
        },
      },
    });
  } catch (error) {
    console.error('Get Recycler By ID Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch recycler',
      error: error.message,
    });
  }
};

// @desc    Approve recycler
// @route   PATCH /api/admin/recyclers/:id/approve
// @access  Private/Admin
const approveRecycler = async (req, res) => {
  try {
    const Recycler = require('../../models/Recycler');
    const { notes } = req.body;

    const recycler = await Recycler.findById(req.params.id);

    if (!recycler) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recycler not found',
      });
    }

    if (recycler.status === 'approved') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Recycler is already approved',
      });
    }

    // Generate random password
    const generatedPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Update recycler with approval details and credentials
    recycler.status = 'approved';
    recycler.approvedAt = new Date();
    recycler.approvedBy = req.user._id;
    if (notes) recycler.approvalNotes = notes;
    recycler.password = hashedPassword;

    await recycler.save();

    // Portal URL
    const portalUrl = process.env.RECYCLER_PORTAL_URL || 'http://localhost:3000/recycler/login';

    // Send approval email with credentials
    try {
      await sendEmail({
        to: recycler.email,
        subject: '🎉 Congratulations! Your Recycler Application Has Been Approved',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">Congratulations ${recycler.name}!</h1>
            
            <p style="font-size: 16px; line-height: 1.6;">
              We are pleased to inform you that your application to become a recycler partner with <strong>Recycle My Device</strong> has been approved!
            </p>

            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #047857;">Your Portal Access Details</h3>
              <p style="margin: 10px 0;"><strong>Email:</strong> ${recycler.email}</p>
              <p style="margin: 10px 0;"><strong>Password:</strong> ${generatedPassword}</p>
              <p style="margin: 10px 0; font-size: 14px; color: #666;">
                <em>Please change this password after your first login for security purposes.</em>
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${portalUrl}" style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Access Recycler Portal
              </a>
            </div>

            <h3 style="color: #1e3a8a;">What's Next?</h3>
            <ul style="line-height: 1.8;">
              <li>Login to your recycler portal using the credentials above</li>
              <li>Complete your profile and add banking details</li>
              <li>Start receiving device recycling orders</li>
              <li>Track your earnings and performance</li>
            </ul>

            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 14px;">
              If you have any questions, please contact us at <a href="mailto:support@recyclemydevice.com">support@recyclemydevice.com</a>
            </p>

            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              <strong>Recycle My Device Team</strong>
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Rollback approval if email fails
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to send approval email. Please try again.',
        error: emailError.message,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Recycler approved successfully',
      data: recycler,
    });
  } catch (error) {
    console.error('Approve Recycler Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to approve recycler',
      error: error.message,
    });
  }
};

// @desc    Reject recycler
// @route   PATCH /api/admin/recyclers/:id/reject
// @access  Private/Admin
const rejectRecycler = async (req, res) => {
  try {
    const Recycler = require('../../models/Recycler');
    const { reason } = req.body;

    if (!reason) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const recycler = await Recycler.findById(req.params.id);

    if (!recycler) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recycler not found',
      });
    }

    recycler.status = 'rejected';
    recycler.rejectedAt = new Date();
    recycler.rejectedBy = req.user._id;
    recycler.rejectionReason = reason;

    await recycler.save();

    // Send rejection email
    try {
      await sendEmail({
        to: recycler.email,
        subject: 'Update on Your Recycler Application',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444;">Application Update</h1>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Hello ${recycler.name},
            </p>

            <p style="font-size: 16px; line-height: 1.6;">
              Thank you for your interest in becoming a recycler partner with <strong>Recycle My Device</strong>.
            </p>

            <p style="font-size: 16px; line-height: 1.6;">
              After careful review, we regret to inform you that we are unable to approve your application at this time.
            </p>

            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #991b1b;">Reason for Rejection:</h3>
              <p style="margin: 0; font-size: 15px;">${reason}</p>
            </div>

            <h3 style="color: #1e3a8a;">What Can You Do?</h3>
            <ul style="line-height: 1.8;">
              <li>Review the reason for rejection carefully</li>
              <li>Address the mentioned issues or concerns</li>
              <li>You may reapply in the future once requirements are met</li>
              <li>Contact us if you need clarification</li>
            </ul>

            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 14px;">
              If you have any questions or need further information, please contact us at <a href="mailto:support@recyclemydevice.com">support@recyclemydevice.com</a>
            </p>

            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              <strong>Recycle My Device Team</strong>
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Recycler rejected successfully',
      data: recycler,
    });
  } catch (error) {
    console.error('Reject Recycler Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to reject recycler',
      error: error.message,
    });
  }
};

// @desc    Suspend recycler
// @route   PATCH /api/admin/recyclers/:id/suspend
// @access  Private/Admin
const suspendRecycler = async (req, res) => {
  try {
    const Recycler = require('../../models/Recycler');
    const { reason } = req.body;

    if (!reason) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Suspension reason is required',
      });
    }

    const recycler = await Recycler.findById(req.params.id);

    if (!recycler) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recycler not found',
      });
    }

    recycler.status = 'suspended';
    recycler.suspendedAt = new Date();
    recycler.suspendedBy = req.user._id;
    recycler.suspensionReason = reason;

    await recycler.save();

    // Send suspension email
    try {
      await sendEmail({
        to: recycler.email,
        subject: 'Account Suspension Notice',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444;">Account Suspended</h1>
            <p>Dear ${recycler.name},</p>
            <p>Your recycler account has been temporarily suspended and you cannot access the system.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>During suspension:</p>
            <ul>
              <li>You cannot log in to your account</li>
              <li>Orders and business operations are paused</li>
              <li>System access is disabled</li>
            </ul>
            <p>If you believe this is an error or have questions, please contact support at <a href="mailto:support@recyclemydevice.com">support@recyclemydevice.com</a></p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              <strong>Recycle My Device Admin Team</strong>
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Recycler suspended successfully',
      data: recycler,
    });
  } catch (error) {
    console.error('Suspend Recycler Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to suspend recycler',
      error: error.message,
    });
  }
};

// @desc    Activate recycler
// @route   PATCH /api/admin/recyclers/:id/activate
// @access  Private/Admin
const activateRecycler = async (req, res) => {
  try {
    const Recycler = require('../../models/Recycler');
    const { reason } = req.body;

    if (!reason) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Activation reason is required',
      });
    }

    const recycler = await Recycler.findById(req.params.id);

    if (!recycler) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recycler not found',
      });
    }

    recycler.status = 'approved';
    recycler.activatedAt = new Date();
    recycler.activationReason = reason;

    await recycler.save();

    // Send activation email
    try {
      await sendEmail({
        to: recycler.email,
        subject: 'Account Activated - Welcome Back!',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1b981b;">Account Activated!</h1>
            <p>Dear ${recycler.name},</p>
            <p>Great news! Your recycler account has been activated and you can now access the system.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>You can now:</p>
            <ul>
              <li>Log in to your account</li>
              <li>Manage orders</li>
              <li>Access devices</li>
              <li>Use all system features</li>
            </ul>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              <strong>Recycle My Device Admin Team</strong>
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Recycler activated successfully',
      data: recycler,
    });
  } catch (error) {
    console.error('Activate Recycler Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to activate recycler',
      error: error.message,
    });
  }
};

// @desc    Update recycler details
// @route   PUT /api/admin/recyclers/:id
// @access  Private/Admin
const updateRecycler = async (req, res) => {
  try {
    const Recycler = require('../../models/Recycler');

    const recycler = await Recycler.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!recycler) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recycler not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Recycler updated successfully',
      data: recycler,
    });
  } catch (error) {
    console.error('Update Recycler Error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Failed to update recycler',
      error: error.message,
    });
  }
};

// @desc    Delete recycler
// @route   DELETE /api/admin/recyclers/:id
// @access  Private/Admin
const deleteRecycler = async (req, res) => {
  try {
    const Recycler = require('../../models/Recycler');

    const recycler = await Recycler.findByIdAndDelete(req.params.id);

    if (!recycler) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recycler not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Recycler deleted successfully',
    });
  } catch (error) {
    console.error('Delete Recycler Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete recycler',
      error: error.message,
    });
  }
};

// @desc    Get recycler statistics
// @route   GET /api/admin/recyclers/:id/stats
// @access  Private/Admin
const getRecyclerStats = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const recyclerId = req.params.id;

    const totalOrders = await Order.countDocuments({ recyclerId });
    const completedOrders = await Order.countDocuments({
      recyclerId,
      status: 'completed',
    });
    const pendingOrders = await Order.countDocuments({
      recyclerId,
      status: { $in: ['pending', 'confirmed'] },
    });

    // Revenue calculation
    const revenueResult = await Order.aggregate([
      {
        $match: {
          recyclerId: require('mongoose').Types.ObjectId(recyclerId),
          status: 'completed',
        },
      },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        pendingOrders,
        totalRevenue,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('Get Recycler Stats Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch recycler statistics',
      error: error.message,
    });
  }
};

// @desc    Toggle recycler active status
// @route   PATCH /api/admin/recyclers/:id/toggle-active
// @access  Private/Admin
const toggleActiveStatus = async (req, res) => {
  try {
    const Recycler = require('../../models/Recycler');
    const { isActive } = req.body;

    const recycler = await Recycler.findById(req.params.id);

    if (!recycler) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recycler not found',
      });
    }

    recycler.isActive = isActive !== undefined ? isActive : !recycler.isActive;
    await recycler.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Recycler ${recycler.isActive ? 'activated' : 'deactivated'} successfully`,
      data: recycler,
    });
  } catch (error) {
    console.error('Toggle Active Status Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to toggle active status',
      error: error.message,
    });
  }
};

module.exports = {
  getAllRecyclers,
  getRecyclerById,
  approveRecycler,
  rejectRecycler,
  suspendRecycler,
  activateRecycler,
  updateRecycler,
  deleteRecycler,
  getRecyclerStats,
  toggleActiveStatus,
};
