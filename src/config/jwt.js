// JWT secret and settings
const jwt = require('jsonwebtoken');

const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
  expiresIn: process.env.JWT_EXPIRE || '7d',
  algorithm: 'HS256',
};

// Generate JWT Token
const generateToken = (payload, expiresIn = jwtConfig.expiresIn) => {
  try {
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn,
      algorithm: jwtConfig.algorithm,
    });
  } catch (error) {
    console.error('JWT Generation Error:', error);
    throw new Error('Failed to generate token');
  }
};

// Verify JWT Token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

// Decode JWT Token (without verification)
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('JWT Decode Error:', error);
    return null;
  }
};

// Generate Access Token (short-lived)
const generateAccessToken = (userId, role) => {
  return generateToken({ userId, role }, '15m');
};

// Generate Refresh Token (long-lived)
const generateRefreshToken = (userId) => {
  return generateToken({ userId }, '30d');
};

// Generate OTP Token (very short-lived)
const generateOTPToken = (email, otp) => {
  return generateToken({ email, otp }, '10m');
};

// Generate Password Reset Token
const generatePasswordResetToken = (userId) => {
  return generateToken({ userId, type: 'password-reset' }, '1h');
};

module.exports = {
  jwtConfig,
  generateToken,
  verifyToken,
  decodeToken,
  generateAccessToken,
  generateRefreshToken,
  generateOTPToken,
  generatePasswordResetToken,
};
