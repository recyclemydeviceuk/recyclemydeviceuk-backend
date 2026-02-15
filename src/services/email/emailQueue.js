// Email queue handler for background processing
const sesService = require('./sesService');
const logger = require('../../utils/logger');

// In-memory email queue (use Redis/Bull for production)
class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Add email to queue
   * @param {object} emailData - Email data
   * @returns {string} - Job ID
   */
  add(emailData) {
    const job = {
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      data: emailData,
      attempts: 0,
      status: 'queued',
      createdAt: new Date(),
    };

    this.queue.push(job);
    logger.info('Email added to queue', { jobId: job.id, to: emailData.to });

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return job.id;
  }

  /**
   * Add templated email to queue
   * @param {string} templateName - Template name
   * @param {string|Array} to - Recipient email(s)
   * @param {object} data - Template data
   * @returns {string} - Job ID
   */
  addTemplatedEmail(templateName, to, data) {
    return this.add({
      type: 'templated',
      templateName,
      to,
      data,
    });
  }

  /**
   * Add custom email to queue
   * @param {object} emailData - Custom email data
   * @returns {string} - Job ID
   */
  addCustomEmail(emailData) {
    return this.add({
      type: 'custom',
      ...emailData,
    });
  }

  /**
   * Process email queue
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    logger.info('Started processing email queue', { queueSize: this.queue.length });

    while (this.queue.length > 0) {
      const job = this.queue[0];

      try {
        job.status = 'processing';
        job.attempts++;

        // Send email based on type
        let result;
        if (job.data.type === 'templated') {
          result = await sesService.sendTemplatedEmail(
            job.data.templateName,
            job.data.to,
            job.data.data
          );
        } else {
          result = await sesService.sendEmail(job.data);
        }

        // Success - remove from queue
        job.status = 'completed';
        job.completedAt = new Date();
        job.result = result;
        
        this.queue.shift();
        logger.info('Email sent successfully', { 
          jobId: job.id, 
          messageId: result.messageId 
        });

      } catch (error) {
        logger.logError(error, { context: 'Email queue processing', jobId: job.id });

        // Retry logic
        if (job.attempts < this.maxRetries) {
          job.status = 'retrying';
          logger.info('Retrying email send', { 
            jobId: job.id, 
            attempt: job.attempts,
            maxRetries: this.maxRetries 
          });

          // Move to end of queue for retry
          this.queue.shift();
          this.queue.push(job);

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          // Max retries reached - mark as failed
          job.status = 'failed';
          job.error = error.message;
          job.failedAt = new Date();
          
          this.queue.shift();
          logger.error('Email send failed after max retries', { 
            jobId: job.id,
            error: error.message 
          });
        }
      }

      // Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing = false;
    logger.info('Finished processing email queue');
  }

  /**
   * Get queue status
   * @returns {object} - Queue status
   */
  getStatus() {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      jobs: this.queue.map(job => ({
        id: job.id,
        status: job.status,
        attempts: job.attempts,
        createdAt: job.createdAt,
      })),
    };
  }

  /**
   * Clear completed jobs older than specified time
   * @param {number} olderThanMs - Time in milliseconds (default: 1 hour)
   */
  clearOldJobs(olderThanMs = 3600000) {
    const now = Date.now();
    const initialSize = this.queue.length;

    this.queue = this.queue.filter(job => {
      if (job.status === 'completed' || job.status === 'failed') {
        const jobTime = job.completedAt || job.failedAt;
        return now - jobTime.getTime() < olderThanMs;
      }
      return true;
    });

    const removed = initialSize - this.queue.length;
    if (removed > 0) {
      logger.info('Cleared old jobs from queue', { removed });
    }
  }

  /**
   * Cancel a job
   * @param {string} jobId - Job ID to cancel
   * @returns {boolean} - Success status
   */
  cancelJob(jobId) {
    const index = this.queue.findIndex(job => job.id === jobId);
    
    if (index !== -1 && this.queue[index].status === 'queued') {
      this.queue.splice(index, 1);
      logger.info('Job cancelled', { jobId });
      return true;
    }
    
    return false;
  }
}

// Create singleton instance
const emailQueue = new EmailQueue();

// Auto-cleanup every hour
setInterval(() => {
  emailQueue.clearOldJobs();
}, 3600000);

module.exports = emailQueue;
