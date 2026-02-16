// Session validation middleware for admin and recycler authentication
const jwt = require('jsonwebtoken');
const AdminSession = require('../models/AdminSession');
const RecyclerSession = require('../models/RecyclerSession');
const { HTTP_STATUS } = require('../config/constants');

// Validate admin session from database
const validateAdminSession = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Check if token has session token
    if (!decoded.sessionToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid token format',
      });
    }

    // Validate session in database
    const session = await AdminSession.validateSession(decoded.sessionToken);

    if (!session) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Session expired or invalid. Please login again',
      });
    }

    // Verify email matches
    if (session.email !== decoded.email) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Session mismatch',
      });
    }

    // Attach user info to request
    req.user = {
      email: decoded.email,
      role: decoded.role,
    };
    req.sessionToken = decoded.sessionToken;
    req.session = session;

    next();
  } catch (error) {
    console.error('Session Validation Error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Session validation failed',
      error: error.message,
    });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Access denied. Admin privileges required',
    });
  }
  next();
};

// Validate recycler session from database
const validateRecyclerSession = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Check if token has session token
    if (!decoded.sessionToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid token format',
      });
    }

    // Validate session in database
    const session = await RecyclerSession.validateSession(decoded.sessionToken);

    if (!session) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Session expired or invalid. Please login again',
      });
    }

    // Verify recycler ID matches
    console.log('Session validation:', {
      sessionRecyclerId: session.recyclerId?.toString(),
      decodedId: decoded.id,
      match: session.recyclerId?.toString() === decoded.id
    });
    
    if (session.recyclerId.toString() !== decoded.id) {
      console.error('Session mismatch detected!', {
        sessionRecyclerId: session.recyclerId?.toString(),
        decodedId: decoded.id,
        sessionToken: decoded.sessionToken
      });
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Session mismatch',
      });
    }

    // Attach user info to request
    req.user = {
      _id: decoded.id,
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    req.sessionToken = decoded.sessionToken;
    req.session = session;

    next();
  } catch (error) {
    console.error('Recycler Session Validation Error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Session validation failed',
      error: error.message,
    });
  }
};

// Check if user is recycler
const requireRecycler = (req, res, next) => {
  if (!req.user || req.user.role !== 'recycler') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Access denied. Recycler privileges required',
    });
  }
  next();
};

module.exports = {
  validateAdminSession,
  requireAdmin,
  validateRecyclerSession,
  requireRecycler,
};
