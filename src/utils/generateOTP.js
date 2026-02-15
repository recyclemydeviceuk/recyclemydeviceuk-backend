// OTP generation utility
const crypto = require('crypto');

/**
 * Generate a random numeric OTP
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} - Generated OTP
 */
const generateNumericOTP = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max).toString();
};

/**
 * Generate a random alphanumeric OTP
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} - Generated OTP
 */
const generateAlphanumericOTP = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    otp += chars[randomIndex];
  }
  
  return otp;
};

/**
 * Generate a secure random token (for password reset, email verification, etc.)
 * @param {number} bytes - Number of bytes (default: 32)
 * @returns {string} - Generated token
 */
const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Generate OTP with expiry time
 * @param {number} length - Length of OTP
 * @param {number} expiryMinutes - Expiry time in minutes (default: 10)
 * @returns {object} - Object with OTP and expiry time
 */
const generateOTPWithExpiry = (length = 6, expiryMinutes = 10) => {
  const otp = generateNumericOTP(length);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  
  return {
    otp,
    expiresAt,
  };
};

/**
 * Verify if OTP is still valid
 * @param {Date} expiresAt - Expiry date/time
 * @returns {boolean} - True if valid, false if expired
 */
const isOTPValid = (expiresAt) => {
  return new Date() <= new Date(expiresAt);
};

/**
 * Generate a PIN (Personal Identification Number)
 * @param {number} length - Length of PIN (default: 4)
 * @returns {string} - Generated PIN
 */
const generatePIN = (length = 4) => {
  return generateNumericOTP(length);
};

/**
 * Hash OTP for storage (optional security layer)
 * @param {string} otp - OTP to hash
 * @returns {string} - Hashed OTP
 */
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Generate a random order/tracking number
 * @returns {string} - Generated order number (e.g., ORD-20240214-ABC123)
 */
const generateOrderNumber = () => {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${date}-${random}`;
};

/**
 * Generate a unique reference ID
 * @param {string} prefix - Prefix for the ID (default: 'REF')
 * @returns {string} - Generated reference ID
 */
const generateReferenceId = (prefix = 'REF') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

module.exports = {
  generateNumericOTP,
  generateAlphanumericOTP,
  generateSecureToken,
  generateOTPWithExpiry,
  isOTPValid,
  generatePIN,
  hashOTP,
  generateOrderNumber,
  generateReferenceId,
};
