// Recycler login
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { HTTP_STATUS } = require('../../config/constants');
const { generateToken } = require('../../config/jwt');
const { sendEmail } = require('../../config/aws');

// Store password reset tokens (in production, use Redis)
const resetTokenStore = new Map();

// @desc    Send OTP to recycler email for login
// @route   POST /api/auth/recycler/send-otp
// @access  Public
const sendRecyclerOTP = async (req, res) => {
  try {
    const Recycler = require('../../models/Recycler');
    const OTP = require('../../models/OTP');
    const { email } = req.body;

    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email is required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find recycler
    const recycler = await Recycler.findOne({ email: normalizedEmail });

    if (!recycler) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'No account found with this email',
      });
    }

    // Check if approved
    if (recycler.status !== 'approved') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Your account is not approved yet. Please wait for admin approval.',
      });
    }

    // Check if suspended
    if (recycler.status === 'suspended') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    // Generate 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: normalizedEmail, type: 'recycler_login' });

    // Create new OTP record
    await OTP.create({
      email: normalizedEmail,
      otp: otpCode,
      type: 'recycler_login',
      expiresAt,
    });

    // Send OTP via email
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Your Recycler Login OTP - Recycle My Device',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1b981b;">Recycler Login Verification</h1>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Hello ${recycler.name},
            </p>

            <p style="font-size: 16px; line-height: 1.6;">
              Your One-Time Password (OTP) for recycler portal login is:
            </p>

            <div style="background-color: #f0fdf4; border-left: 4px solid #1b981b; padding: 20px; margin: 20px 0; text-align: center;">
              <h2 style="margin: 0; font-size: 36px; color: #1b981b; letter-spacing: 8px;">${otpCode}</h2>
            </div>

            <p style="font-size: 14px; color: #666;">
              This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
            </p>

            <p style="font-size: 14px; color: #666;">
              If you didn't request this OTP, please ignore this email or contact support immediately.
            </p>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              <strong>Recycle My Device Team</strong>
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to send OTP email',
        error: emailError.message,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'OTP sent to your email',
      data: {
        email: normalizedEmail,
        recyclerName: recycler.name,
        companyName: recycler.companyName,
      },
    });
  } catch (error) {
    console.error('Send Recycler OTP Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message,
    });
  }
};

// @desc    Verify OTP and login recycler
// @route   POST /api/auth/recycler/verify-otp
// @access  Public
const verifyRecyclerOTP = async (req, res) => {
  try {
    const Recycler = require('../../models/Recycler');
    const OTP = require('../../models/OTP');
    const RecyclerSession = require('../../models/RecyclerSession');
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find recycler
    const recycler = await Recycler.findOne({ email: normalizedEmail });

    if (!recycler) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Account not found',
      });
    }

    // Check if approved
    if (recycler.status !== 'approved') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Your account is not approved yet',
      });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      type: 'recycler_login',
      verified: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'OTP not found or already used',
      });
    }

    // Check if OTP expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'OTP has expired. Please request a new one',
      });
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP',
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp.trim()) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid OTP',
        attemptsLeft: 3 - otpRecord.attempts,
      });
    }

    // OTP verified - mark as used
    otpRecord.verified = true;
    await otpRecord.save();

    // Invalidate any existing sessions for this recycler
    await RecyclerSession.invalidateAllUserSessions(recycler._id);

    // Create new session in database
    const sessionToken = RecyclerSession.generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await RecyclerSession.create({
      recyclerId: recycler._id,
      email: normalizedEmail,
      sessionToken,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      expiresAt,
    });

    // Also generate JWT token for additional security
    console.log('Creating JWT with:', {
      id: recycler._id.toString(),
      email: normalizedEmail,
      role: 'recycler',
      sessionToken
    });
    
    const jwtToken = generateToken({ 
      id: recycler._id.toString(), // Convert to string
      email: normalizedEmail,
      role: 'recycler',
      sessionToken, // Include session token in JWT
    });

    // Update last login
    recycler.lastLogin = new Date();
    await recycler.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login successful',
      data: {
        token: jwtToken,
        sessionToken,
        recycler: {
          id: recycler._id,
          name: recycler.name,
          email: recycler.email,
          companyName: recycler.companyName,
          status: recycler.status,
          isFirstLogin: !recycler.lastLogin,
        },
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Verify Recycler OTP Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message,
    });
  }
};

// @desc    Change recycler password
// @route   PUT /api/auth/recycler/change-password
// @access  Private/Recycler
const changeRecyclerPassword = async (req, res) => {
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

    // Find recycler
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
    console.error('Change Recycler Password Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
};

// @desc    Request password reset
// @route   POST /api/auth/recycler/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const Recycler = require('../../models/Recycler');
    const { email } = req.body;

    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Find recycler
    const recycler = await Recycler.findOne({ email });

    if (!recycler) {
      // Don't reveal if email exists or not
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'If your email exists, you will receive a password reset link',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store token with 1 hour expiry
    resetTokenStore.set(hashedToken, {
      recyclerId: recycler._id,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    // Create reset URL
    const resetUrl = `${process.env.RECYCLER_PORTAL_URL || 'http://localhost:3000/recycler'}/reset-password?token=${resetToken}`;

    // Send email
    try {
      await sendEmail({
        to: email,
        subject: 'Password Reset Request',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e3a8a;">Password Reset Request</h1>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Hello ${recycler.name},
            </p>

            <p style="font-size: 16px; line-height: 1.6;">
              You requested a password reset for your recycler account. Click the button below to reset your password:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>

            <p style="font-size: 14px; color: #666;">
              This link will expire in 1 hour. If you didn't request this, please ignore this email.
            </p>

            <p style="font-size: 14px; color: #666;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; color: #999; word-break: break-all;">
              ${resetUrl}
            </p>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              <strong>Recycle My Device Team</strong>
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to send password reset email',
        error: emailError.message,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to process password reset request',
      error: error.message,
    });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/recycler/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const Recycler = require('../../models/Recycler');
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Token and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    // Hash token to find it
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Check if token exists
    const storedToken = resetTokenStore.get(hashedToken);

    if (!storedToken) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Check if token expired
    if (Date.now() > storedToken.expiresAt) {
      resetTokenStore.delete(hashedToken);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Reset token has expired',
      });
    }

    // Find recycler
    const recycler = await Recycler.findById(storedToken.recyclerId);

    if (!recycler) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recycler not found',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    recycler.password = hashedPassword;
    await recycler.save();

    // Delete token
    resetTokenStore.delete(hashedToken);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message,
    });
  }
};

// @desc    Get recycler profile
// @route   GET /api/auth/recycler/profile
// @access  Private/Recycler
const getRecyclerProfile = async (req, res) => {
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
    console.error('Get Recycler Profile Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
};

// @desc    Update recycler profile
// @route   PUT /api/auth/recycler/profile
// @access  Private/Recycler
const updateRecyclerProfile = async (req, res) => {
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
    console.error('Update Recycler Profile Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

// @desc    Get recycler statistics
// @route   GET /api/auth/recycler/stats
// @access  Private/Recycler
const getRecyclerStats = async (req, res) => {
  try {
    const Order = require('../../models/Order');

    const recyclerId = req.user._id;

    // Get order statistics
    const totalOrders = await Order.countDocuments({ recyclerId });
    const completedOrders = await Order.countDocuments({ 
      recyclerId, 
      status: 'completed' 
    });
    const pendingOrders = await Order.countDocuments({ 
      recyclerId, 
      status: { $in: ['pending', 'processing'] }
    });

    // Calculate total earnings
    const earnings = await Order.aggregate([
      { 
        $match: { 
          recyclerId: require('mongoose').Types.ObjectId(recyclerId),
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

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        pendingOrders,
        totalEarnings,
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

// @desc    Logout recycler (invalidate session)
// @route   POST /api/auth/recycler/logout
// @access  Private/Recycler
const logoutRecycler = async (req, res) => {
  try {
    const RecyclerSession = require('../../models/RecyclerSession');
    const sessionToken = req.sessionToken; // Set by middleware

    if (sessionToken) {
      await RecyclerSession.invalidateSession(sessionToken);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout Recycler Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to logout',
      error: error.message,
    });
  }
};

module.exports = {
  sendRecyclerOTP,
  verifyRecyclerOTP,
  logoutRecycler,
  changeRecyclerPassword,
  forgotPassword,
  resetPassword,
  getRecyclerProfile,
  updateRecyclerProfile,
  getRecyclerStats,
};
