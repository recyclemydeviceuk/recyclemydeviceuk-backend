// Admin login/OTP (Email whitelist based)
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { HTTP_STATUS } = require('../../config/constants');
const { generateToken } = require('../../config/jwt');
const { sendEmail } = require('../../config/aws');

// Get allowed admin emails from environment
const getAllowedAdminEmails = () => {
  const adminEmails = process.env.ADMIN_EMAILS || '';
  return adminEmails.split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
};

// @desc    Check if email is authorized admin (whitelist check)
// @route   POST /api/auth/admin/check-email
// @access  Public
const checkAdminEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email is required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const allowedEmails = getAllowedAdminEmails();

    if (!allowedEmails.includes(normalizedEmail)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'This email is not authorized for admin access',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Email authorized. OTP will be sent.',
      data: { email: normalizedEmail },
    });
  } catch (error) {
    console.error('Check Admin Email Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to check email',
      error: error.message,
    });
  }
};

// @desc    Send OTP to admin email (whitelist verified)
// @route   POST /api/auth/admin/send-otp
// @access  Public
const sendAdminOTP = async (req, res) => {
  try {
    const OTP = require('../../models/OTP');
    const { email } = req.body;

    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email is required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const allowedEmails = getAllowedAdminEmails();

    // Check if email is in whitelist
    if (!allowedEmails.includes(normalizedEmail)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'This email is not authorized for admin access',
      });
    }

    // Generate 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: normalizedEmail, type: 'admin_login' });

    // Create new OTP record
    await OTP.create({
      email: normalizedEmail,
      otp: otpCode,
      type: 'admin_login',
      expiresAt,
    });

    // Send OTP via email
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Your Admin Login OTP - Recycle My Device',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e3a8a;">Admin Login Verification</h1>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Hello Admin,
            </p>

            <p style="font-size: 16px; line-height: 1.6;">
              Your One-Time Password (OTP) for admin panel login is:
            </p>

            <div style="background-color: #f0f4ff; border-left: 4px solid #1e3a8a; padding: 20px; margin: 20px 0; text-align: center;">
              <h2 style="margin: 0; font-size: 36px; color: #1e3a8a; letter-spacing: 8px;">${otpCode}</h2>
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
    });
  } catch (error) {
    console.error('Send Admin OTP Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message,
    });
  }
};

// @desc    Verify OTP and login admin
// @route   POST /api/auth/admin/verify-otp
// @access  Public
const verifyAdminOTP = async (req, res) => {
  try {
    const OTP = require('../../models/OTP');
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const allowedEmails = getAllowedAdminEmails();

    // Verify email is in whitelist
    if (!allowedEmails.includes(normalizedEmail)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'This email is not authorized for admin access',
      });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      type: 'admin_login',
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

    // Generate token with email and admin role
    const token = generateToken({ 
      email: normalizedEmail, 
      role: 'admin' 
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: {
          email: normalizedEmail,
          role: 'admin',
        },
      },
    });
  } catch (error) {
    console.error('Verify Admin OTP Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message,
    });
  }
};

// @desc    Change admin password
// @route   PUT /api/auth/admin/change-password
// @access  Private/Admin
const changeAdminPassword = async (req, res) => {
  try {
    const User = require('../../models/User');
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    // Find admin
    const admin = await User.findById(req.user._id);

    if (!admin) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Admin not found',
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);

    if (!isPasswordValid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    admin.password = hashedPassword;
    await admin.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change Admin Password Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
};

// @desc    Get admin profile
// @route   GET /api/auth/admin/profile
// @access  Private/Admin
const getAdminProfile = async (req, res) => {
  try {
    const User = require('../../models/User');

    const admin = await User.findById(req.user._id).select('-password');

    if (!admin) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Admin not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error('Get Admin Profile Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
};

// @desc    Update admin profile
// @route   PUT /api/auth/admin/profile
// @access  Private/Admin
const updateAdminProfile = async (req, res) => {
  try {
    const User = require('../../models/User');
    const { name, phone } = req.body;

    const admin = await User.findById(req.user._id);

    if (!admin) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Admin not found',
      });
    }

    if (name) admin.name = name;
    if (phone) admin.phone = phone;

    await admin.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Update Admin Profile Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

module.exports = {
  checkAdminEmail,
  sendAdminOTP,
  verifyAdminOTP,
  changeAdminPassword,
  getAdminProfile,
  updateAdminProfile,
};
