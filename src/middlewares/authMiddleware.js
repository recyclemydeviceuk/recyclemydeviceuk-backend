// JWT verification
const jwt = require('jsonwebtoken');
const { HTTP_STATUS } = require('../config/constants');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Not authorized, no token provided',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Not authorized, token failed',
      });
    }
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Not authorized',
    });
  }
};

// Admin only middleware
const adminOnly = async (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    next();
  } else {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Access denied. Admin only.',
    });
  }
};

// Recycler only middleware
const recyclerOnly = async (req, res, next) => {
  if (req.user && req.user.role === 'recycler') {
    next();
  } else {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Access denied. Recycler only.',
    });
  }
};

// Admin or Recycler middleware
const adminOrRecyclerOnly = async (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'recycler')) {
    next();
  } else {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Access denied. Admin or Recycler only.',
    });
  }
};

module.exports = {
  protect,
  adminOnly,
  recyclerOnly,
  adminOrRecyclerOnly,
};
