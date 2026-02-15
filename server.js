// Server entry point
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');
const logger = require('./src/utils/logger');

// Configuration
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate required environment variables
if (!MONGODB_URI) {
  logger.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// MongoDB connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    logger.info(`MongoDB Connected: ${mongoose.connection.host}`);
    logger.info(`Database: ${mongoose.connection.name}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// MongoDB connection events
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      // Close database connection
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
let server;

const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();

    // Start HTTP server
    server = app.listen(PORT, () => {
      logger.info('='.repeat(50));
      logger.info(`🚀 Server running in ${NODE_ENV} mode`);
      logger.info(`📡 Server listening on port ${PORT}`);
      logger.info(`🌐 API URL: http://localhost:${PORT}`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api`);
      logger.info(`✅ Health Check: http://localhost:${PORT}/api/health`);
      logger.info('='.repeat(50));
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Initialize server
startServer();

// Export for testing
module.exports = { app, server };
