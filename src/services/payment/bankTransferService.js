// Bank transfer payment service
const logger = require('../../utils/logger');
const { generateReferenceId } = require('../../utils/generateOTP');

/**
 * Bank Transfer Service
 * Handles bank transfer payment processing and tracking
 */
class BankTransferService {
  constructor() {
    this.transfers = [];
  }

  /**
   * Initiate a bank transfer
   * @param {object} data - Transfer data
   * @returns {object} - Transfer details
   */
  async initiateTransfer(data) {
    const transfer = {
      id: generateReferenceId('TXN'),
      orderId: data.orderId,
      recipientName: data.recipientName,
      recipientAccountNumber: data.recipientAccountNumber,
      recipientSortCode: data.recipientSortCode,
      amount: data.amount,
      currency: data.currency || 'GBP',
      reference: data.reference || `Order ${data.orderId}`,
      status: 'pending',
      initiatedAt: new Date(),
      metadata: data.metadata || {},
    };

    this.transfers.push(transfer);
    
    logger.logPayment('initiated', transfer.amount, transfer.orderId, {
      transferId: transfer.id,
      method: 'bank_transfer',
    });

    return {
      success: true,
      transfer,
      message: 'Bank transfer initiated successfully',
    };
  }

  /**
   * Process a bank transfer (simulate payment processing)
   * @param {string} transferId - Transfer ID
   * @returns {object} - Processing result
   */
  async processTransfer(transferId) {
    const transfer = this.transfers.find(t => t.id === transferId);

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status !== 'pending') {
      throw new Error(`Transfer already ${transfer.status}`);
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate processing (90% success rate)
    const success = Math.random() > 0.1;

    if (success) {
      transfer.status = 'processing';
      transfer.processedAt = new Date();

      logger.logPayment('processing', transfer.amount, transfer.orderId, {
        transferId: transfer.id,
      });

      // Simulate completion after processing
      setTimeout(() => {
        this.completeTransfer(transferId);
      }, 5000);

      return {
        success: true,
        transfer,
        message: 'Transfer is being processed',
      };
    } else {
      transfer.status = 'failed';
      transfer.failedAt = new Date();
      transfer.failureReason = 'Insufficient funds or invalid account details';

      logger.error('Payment processing failed', {
        transferId: transfer.id,
        orderId: transfer.orderId,
      });

      return {
        success: false,
        transfer,
        message: 'Transfer processing failed',
      };
    }
  }

  /**
   * Complete a bank transfer
   * @param {string} transferId - Transfer ID
   * @returns {object} - Completion result
   */
  async completeTransfer(transferId) {
    const transfer = this.transfers.find(t => t.id === transferId);

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    transfer.status = 'completed';
    transfer.completedAt = new Date();
    transfer.transactionHash = `HASH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.logPayment('completed', transfer.amount, transfer.orderId, {
      transferId: transfer.id,
      transactionHash: transfer.transactionHash,
    });

    return {
      success: true,
      transfer,
      message: 'Transfer completed successfully',
    };
  }

  /**
   * Cancel a bank transfer
   * @param {string} transferId - Transfer ID
   * @param {string} reason - Cancellation reason
   * @returns {object} - Cancellation result
   */
  async cancelTransfer(transferId, reason) {
    const transfer = this.transfers.find(t => t.id === transferId);

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status === 'completed') {
      throw new Error('Cannot cancel completed transfer');
    }

    transfer.status = 'cancelled';
    transfer.cancelledAt = new Date();
    transfer.cancellationReason = reason;

    logger.info('Transfer cancelled', {
      transferId: transfer.id,
      orderId: transfer.orderId,
      reason,
    });

    return {
      success: true,
      transfer,
      message: 'Transfer cancelled successfully',
    };
  }

  /**
   * Get transfer by ID
   * @param {string} transferId - Transfer ID
   * @returns {object} - Transfer details
   */
  getTransfer(transferId) {
    return this.transfers.find(t => t.id === transferId);
  }

  /**
   * Get transfers by order ID
   * @param {string} orderId - Order ID
   * @returns {Array} - Order transfers
   */
  getOrderTransfers(orderId) {
    return this.transfers.filter(t => t.orderId === orderId);
  }

  /**
   * Get transfer status
   * @param {string} transferId - Transfer ID
   * @returns {object} - Transfer status
   */
  getTransferStatus(transferId) {
    const transfer = this.getTransfer(transferId);

    if (!transfer) {
      return {
        success: false,
        message: 'Transfer not found',
      };
    }

    return {
      success: true,
      status: transfer.status,
      transfer: {
        id: transfer.id,
        orderId: transfer.orderId,
        amount: transfer.amount,
        currency: transfer.currency,
        status: transfer.status,
        initiatedAt: transfer.initiatedAt,
        completedAt: transfer.completedAt,
      },
    };
  }

  /**
   * Validate bank account details
   * @param {object} accountDetails - Account details
   * @returns {object} - Validation result
   */
  validateAccountDetails(accountDetails) {
    const errors = [];

    // Validate account number (8 digits)
    if (!/^\d{8}$/.test(accountDetails.accountNumber)) {
      errors.push('Account number must be 8 digits');
    }

    // Validate sort code (6 digits, can include hyphens)
    const sortCode = accountDetails.sortCode.replace(/-/g, '');
    if (!/^\d{6}$/.test(sortCode)) {
      errors.push('Sort code must be 6 digits');
    }

    // Validate account name
    if (!accountDetails.accountName || accountDetails.accountName.length < 2) {
      errors.push('Account name is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate transfer fee
   * @param {number} amount - Transfer amount
   * @returns {object} - Fee details
   */
  calculateFee(amount) {
    // Free for transfers over £100, otherwise £2.50 fee
    const feePercentage = 0;
    const flatFee = amount >= 100 ? 0 : 2.5;
    const fee = (amount * feePercentage / 100) + flatFee;
    const total = amount + fee;

    return {
      amount,
      fee,
      total,
      currency: 'GBP',
    };
  }

  /**
   * Get transfer statistics
   * @returns {object} - Transfer stats
   */
  getStatistics() {
    const stats = {
      total: this.transfers.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      totalAmount: 0,
      completedAmount: 0,
    };

    this.transfers.forEach(transfer => {
      stats[transfer.status]++;
      stats.totalAmount += transfer.amount;
      
      if (transfer.status === 'completed') {
        stats.completedAmount += transfer.amount;
      }
    });

    return stats;
  }
}

// Create singleton instance
const bankTransferService = new BankTransferService();

module.exports = bankTransferService;
