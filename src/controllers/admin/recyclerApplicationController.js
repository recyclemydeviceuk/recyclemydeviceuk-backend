// Admin Recycler Application Management
const RecyclerApplication = require('../../models/RecyclerApplication');
const Recycler = require('../../models/Recycler');
const { HTTP_STATUS, PAGINATION } = require('../../config/constants');
const { sendEmail } = require('../../config/aws');

// @desc    Get all recycler applications
// @route   GET /api/admin/recycler-applications
// @access  Private/Admin
const getAllApplications = async (req, res) => {
  try {
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
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const applications = await RecyclerApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('processedBy', 'email')
      .populate('recyclerId', 'companyName email');

    const total = await RecyclerApplication.countDocuments(filter);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get All Applications Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message,
    });
  }
};

// @desc    Get application by ID
// @route   GET /api/admin/recycler-applications/:id
// @access  Private/Admin
const getApplicationById = async (req, res) => {
  try {
    const application = await RecyclerApplication.findById(req.params.id)
      .populate('processedBy', 'email')
      .populate('recyclerId', 'companyName email status');

    if (!application) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Get Application By ID Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message,
    });
  }
};

// @desc    Approve recycler application and create recycler account
// @route   PATCH /api/admin/recycler-applications/:id/approve
// @access  Private/Admin
const approveApplication = async (req, res) => {
  try {
    const { notes } = req.body;

    const application = await RecyclerApplication.findById(req.params.id);

    if (!application) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Application not found',
      });
    }

    if (application.status === 'approved') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Application is already approved',
      });
    }

    // Check if recycler already exists with this email
    const existingRecycler = await Recycler.findOne({ email: application.email });
    if (existingRecycler) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'A recycler with this email already exists',
      });
    }

    // Create recycler account (no password - OTP authentication only)
    const recycler = new Recycler({
      name: application.name,
      email: application.email,
      phone: application.phone,
      companyName: application.companyName,
      website: application.website,
      businessDescription: application.businessDescription,
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: req.user._id,
      approvalNotes: notes,
    });

    await recycler.save();

    // Update application
    application.status = 'approved';
    application.processedAt = new Date();
    application.processedBy = req.user._id;
    if (notes) application.approvalNotes = notes;
    application.convertedToRecycler = true;
    application.recyclerId = recycler._id;

    await application.save();

    // Portal URL
    const portalUrl = process.env.RECYCLER_PORTAL_URL || 'http://localhost:3000/recycler/login';

    // Send approval email with OTP login instructions
    try {
      await sendEmail({
        to: application.email,
        subject: 'Congratulations! Your Recycler Application Has Been Approved',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">Congratulations ${application.name}!</h1>
            
            <p style="font-size: 16px; line-height: 1.6;">
              We are pleased to inform you that your application to become a recycler partner with <strong>Recycle My Device</strong> has been approved!
            </p>

            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #047857;">How to Access Your Portal</h3>
              <p style="margin: 10px 0;"><strong>Your Email:</strong> ${application.email}</p>
              <p style="margin: 10px 0; font-size: 14px; color: #666;">
                <strong>Login Method:</strong> We use secure OTP (One-Time Password) authentication for your safety.
              </p>
              <p style="margin: 10px 0; font-size: 14px; color: #666;">
                <em>Each time you log in, we'll send a unique code to your email.</em>
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${portalUrl}" style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Access Recycler Portal
              </a>
            </div>

            <h3 style="color: #1e3a8a;">What's Next?</h3>
            <ul style="line-height: 1.8;">
              <li>Click the button above to access the recycler portal</li>
              <li>Enter your email address (${application.email})</li>
              <li>You'll receive an OTP code via email</li>
              <li>Complete your profile and add banking details</li>
              <li>Start receiving device recycling orders</li>
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
      // Don't rollback - just log the error
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Application approved and recycler account created successfully',
      data: {
        application,
        recycler: {
          id: recycler._id,
          companyName: recycler.companyName,
          email: recycler.email,
        },
      },
    });
  } catch (error) {
    console.error('Approve Application Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to approve application',
      error: error.message,
    });
  }
};

// @desc    Reject recycler application
// @route   PATCH /api/admin/recycler-applications/:id/reject
// @access  Private/Admin
const rejectApplication = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const application = await RecyclerApplication.findById(req.params.id);

    if (!application) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Application not found',
      });
    }

    if (application.status === 'rejected') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Application is already rejected',
      });
    }

    application.status = 'rejected';
    application.processedAt = new Date();
    application.processedBy = req.user._id;
    application.rejectionReason = reason;

    await application.save();

    // Send rejection email
    try {
      await sendEmail({
        to: application.email,
        subject: 'Update on Your Recycler Application',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444;">Application Update</h1>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Hello ${application.name},
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
      message: 'Application rejected successfully',
      data: application,
    });
  } catch (error) {
    console.error('Reject Application Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to reject application',
      error: error.message,
    });
  }
};

// @desc    Delete application
// @route   DELETE /api/admin/recycler-applications/:id
// @access  Private/Admin
const deleteApplication = async (req, res) => {
  try {
    const application = await RecyclerApplication.findById(req.params.id);

    if (!application) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Don't allow deletion of approved applications that have been converted
    if (application.status === 'approved' && application.convertedToRecycler) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Cannot delete approved application that has been converted to recycler',
      });
    }

    await application.deleteOne();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (error) {
    console.error('Delete Application Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete application',
      error: error.message,
    });
  }
};

// @desc    Get application statistics
// @route   GET /api/admin/recycler-applications/stats
// @access  Private/Admin
const getApplicationStats = async (req, res) => {
  try {
    const totalApplications = await RecyclerApplication.countDocuments();
    const pendingApplications = await RecyclerApplication.countDocuments({ status: 'pending' });
    const approvedApplications = await RecyclerApplication.countDocuments({ status: 'approved' });
    const rejectedApplications = await RecyclerApplication.countDocuments({ status: 'rejected' });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        total: totalApplications,
        pending: pendingApplications,
        approved: approvedApplications,
        rejected: rejectedApplications,
      },
    });
  } catch (error) {
    console.error('Get Application Stats Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch application statistics',
      error: error.message,
    });
  }
};

module.exports = {
  getAllApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
  deleteApplication,
  getApplicationStats,
};
