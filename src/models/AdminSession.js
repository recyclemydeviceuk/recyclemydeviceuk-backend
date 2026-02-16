// Admin Session Model for database-based session management
const mongoose = require('mongoose');
const crypto = require('crypto');

const adminSessionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for automatic session cleanup
adminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate secure session token
adminSessionSchema.statics.generateSessionToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Validate and refresh session
adminSessionSchema.statics.validateSession = async function(sessionToken) {
  const session = await this.findOne({
    sessionToken,
    isActive: true,
    expiresAt: { $gt: new Date() },
  });

  if (session) {
    // Update last activity
    session.lastActivity = new Date();
    await session.save();
  }

  return session;
};

// Invalidate session (logout)
adminSessionSchema.statics.invalidateSession = async function(sessionToken) {
  return await this.findOneAndUpdate(
    { sessionToken },
    { isActive: false },
    { new: true }
  );
};

// Invalidate all sessions for an email
adminSessionSchema.statics.invalidateAllUserSessions = async function(email) {
  return await this.updateMany(
    { email: email.toLowerCase() },
    { isActive: false }
  );
};

const AdminSession = mongoose.model('AdminSession', adminSessionSchema);

module.exports = AdminSession;
