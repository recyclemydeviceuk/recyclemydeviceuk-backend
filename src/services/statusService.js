// Status service for fetching dynamic order and payment statuses
const logger = require('../utils/logger');

/**
 * Get order status by name
 * @param {string} statusName - Status name
 * @returns {Promise<object>} - Status details
 */
const getOrderStatus = async (statusName) => {
  try {
    const OrderStatus = require('../models/OrderStatus');
    
    const status = await OrderStatus.findOne({ 
      name: statusName.toLowerCase(),
      isActive: true 
    });

    return status;
  } catch (error) {
    logger.logError(error, { context: 'getOrderStatus', statusName });
    return null;
  }
};

/**
 * Get all active order statuses
 * @returns {Promise<Array>} - Array of order statuses
 */
const getAllOrderStatuses = async () => {
  try {
    const OrderStatus = require('../models/OrderStatus');
    
    const statuses = await OrderStatus.find({ isActive: true })
      .sort({ order: 1, name: 1 });

    return statuses;
  } catch (error) {
    logger.logError(error, { context: 'getAllOrderStatuses' });
    return [];
  }
};

/**
 * Get payment status by name
 * @param {string} statusName - Status name
 * @returns {Promise<object>} - Status details
 */
const getPaymentStatus = async (statusName) => {
  try {
    const PaymentStatus = require('../models/PaymentStatus');
    
    const status = await PaymentStatus.findOne({ 
      name: statusName.toLowerCase(),
      isActive: true 
    });

    return status;
  } catch (error) {
    logger.logError(error, { context: 'getPaymentStatus', statusName });
    return null;
  }
};

/**
 * Get all active payment statuses
 * @returns {Promise<Array>} - Array of payment statuses
 */
const getAllPaymentStatuses = async () => {
  try {
    const PaymentStatus = require('../models/PaymentStatus');
    
    const statuses = await PaymentStatus.find({ isActive: true })
      .sort({ order: 1, name: 1 });

    return statuses;
  } catch (error) {
    logger.logError(error, { context: 'getAllPaymentStatuses' });
    return [];
  }
};

/**
 * Get default order status
 * @returns {Promise<object>} - Default order status
 */
const getDefaultOrderStatus = async () => {
  try {
    const OrderStatus = require('../models/OrderStatus');
    
    const status = await OrderStatus.findOne({ 
      isDefault: true,
      isActive: true 
    });

    return status;
  } catch (error) {
    logger.logError(error, { context: 'getDefaultOrderStatus' });
    return null;
  }
};

/**
 * Get default payment status
 * @returns {Promise<object>} - Default payment status
 */
const getDefaultPaymentStatus = async () => {
  try {
    const PaymentStatus = require('../models/PaymentStatus');
    
    const status = await PaymentStatus.findOne({ 
      isDefault: true,
      isActive: true 
    });

    return status;
  } catch (error) {
    logger.logError(error, { context: 'getDefaultPaymentStatus' });
    return null;
  }
};

/**
 * Validate order status exists
 * @param {string} statusName - Status name
 * @returns {Promise<boolean>} - True if exists
 */
const validateOrderStatus = async (statusName) => {
  const status = await getOrderStatus(statusName);
  return !!status;
};

/**
 * Validate payment status exists
 * @param {string} statusName - Status name
 * @returns {Promise<boolean>} - True if exists
 */
const validatePaymentStatus = async (statusName) => {
  const status = await getPaymentStatus(statusName);
  return !!status;
};

/**
 * Get order status with color for UI display
 * @param {string} statusName - Status name
 * @returns {Promise<object>} - Status with display properties
 */
const getOrderStatusForDisplay = async (statusName) => {
  const status = await getOrderStatus(statusName);
  
  if (!status) {
    return {
      name: statusName,
      label: statusName,
      color: '#6B7280',
    };
  }

  return {
    name: status.name,
    label: status.label,
    color: status.color,
    description: status.description,
  };
};

/**
 * Get payment status with color for UI display
 * @param {string} statusName - Status name
 * @returns {Promise<object>} - Status with display properties
 */
const getPaymentStatusForDisplay = async (statusName) => {
  const status = await getPaymentStatus(statusName);
  
  if (!status) {
    return {
      name: statusName,
      label: statusName,
      color: '#6B7280',
    };
  }

  return {
    name: status.name,
    label: status.label,
    color: status.color,
    description: status.description,
  };
};

module.exports = {
  getOrderStatus,
  getAllOrderStatuses,
  getPaymentStatus,
  getAllPaymentStatuses,
  getDefaultOrderStatus,
  getDefaultPaymentStatus,
  validateOrderStatus,
  validatePaymentStatus,
  getOrderStatusForDisplay,
  getPaymentStatusForDisplay,
};
