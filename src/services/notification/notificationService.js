// Notification service for in-app and push notifications
const logger = require('../../utils/logger');

/**
 * In-memory notification store (use database/Redis in production)
 */
class NotificationService {
  constructor() {
    this.notifications = [];
  }

  /**
   * Create a new notification
   * @param {object} data - Notification data
   * @returns {object} - Created notification
   */
  create(data) {
    const notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: data.userId,
      type: data.type, // 'order', 'payment', 'system', 'message'
      title: data.title,
      message: data.message,
      data: data.data || {},
      read: false,
      createdAt: new Date(),
    };

    this.notifications.push(notification);
    logger.info('Notification created', { id: notification.id, userId: data.userId });

    return notification;
  }

  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {object} options - Query options
   * @returns {Array} - User notifications
   */
  getUserNotifications(userId, options = {}) {
    const { limit = 20, unreadOnly = false } = options;

    let userNotifications = this.notifications
      .filter(notif => notif.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);

    if (unreadOnly) {
      userNotifications = userNotifications.filter(notif => !notif.read);
    }

    return userNotifications.slice(0, limit);
  }

  /**
   * Get unread notification count
   * @param {string} userId - User ID
   * @returns {number} - Unread count
   */
  getUnreadCount(userId) {
    return this.notifications.filter(notif => notif.userId === userId && !notif.read).length;
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {boolean} - Success status
   */
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      notification.readAt = new Date();
      logger.info('Notification marked as read', { id: notificationId });
      return true;
    }
    
    return false;
  }

  /**
   * Mark all user notifications as read
   * @param {string} userId - User ID
   * @returns {number} - Number of notifications marked
   */
  markAllAsRead(userId) {
    let count = 0;
    
    this.notifications
      .filter(notif => notif.userId === userId && !notif.read)
      .forEach(notif => {
        notif.read = true;
        notif.readAt = new Date();
        count++;
      });

    logger.info('All notifications marked as read', { userId, count });
    return count;
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @returns {boolean} - Success status
   */
  delete(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    
    if (index !== -1) {
      this.notifications.splice(index, 1);
      logger.info('Notification deleted', { id: notificationId });
      return true;
    }
    
    return false;
  }

  /**
   * Delete all user notifications
   * @param {string} userId - User ID
   * @returns {number} - Number of notifications deleted
   */
  deleteAll(userId) {
    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter(notif => notif.userId !== userId);
    const deleted = initialLength - this.notifications.length;
    
    logger.info('All user notifications deleted', { userId, count: deleted });
    return deleted;
  }

  /**
   * Send order notification
   * @param {string} userId - User ID
   * @param {object} orderData - Order details
   */
  sendOrderNotification(userId, orderData) {
    return this.create({
      userId,
      type: 'order',
      title: 'Order Update',
      message: `Your order ${orderData.orderNumber} has been ${orderData.status}`,
      data: orderData,
    });
  }

  /**
   * Send payment notification
   * @param {string} userId - User ID
   * @param {object} paymentData - Payment details
   */
  sendPaymentNotification(userId, paymentData) {
    return this.create({
      userId,
      type: 'payment',
      title: 'Payment Received',
      message: `Payment of £${paymentData.amount} has been processed`,
      data: paymentData,
    });
  }

  /**
   * Send system notification
   * @param {string} userId - User ID
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   */
  sendSystemNotification(userId, title, message) {
    return this.create({
      userId,
      type: 'system',
      title,
      message,
    });
  }

  /**
   * Broadcast notification to multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {object} notificationData - Notification data
   * @returns {Array} - Created notifications
   */
  broadcast(userIds, notificationData) {
    const notifications = userIds.map(userId => 
      this.create({ userId, ...notificationData })
    );

    logger.info('Broadcast notification sent', { 
      recipientCount: userIds.length,
      type: notificationData.type 
    });

    return notifications;
  }

  /**
   * Clean up old notifications (older than 30 days)
   * @returns {number} - Number of notifications deleted
   */
  cleanup() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter(
      notif => notif.createdAt > thirtyDaysAgo
    );
    
    const deleted = initialLength - this.notifications.length;
    logger.info('Notification cleanup completed', { deleted });
    
    return deleted;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Auto-cleanup every 24 hours
setInterval(() => {
  notificationService.cleanup();
}, 24 * 60 * 60 * 1000);

module.exports = notificationService;
