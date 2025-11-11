const dotenv = require('dotenv');
const http = require('http');
const app = require('./src/app');
const { sequelize, testConnection } = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');

// Load environment variables
dotenv.config();

// Configuration
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create HTTP server
const server = http.createServer(app);

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Stop accepting new requests
  server.close(async () => {
    console.log('HTTP server closed');

    try {
      // Close database connection
      await sequelize.close();
      console.log('✅ Database connection closed');

      // Close Redis connection
      // Note: Redis client may not be connected if it failed to start
      try {
        const { redisClient } = require('./src/config/redis');
        if (redisClient.isOpen) {
          await redisClient.quit();
          console.log('✅ Redis connection closed');
        }
      } catch (redisError) {
        console.log('Redis was not connected');
      }

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting Lumive Access Server...');
    console.log(`📍 Environment: ${NODE_ENV}`);

    // Test database connection
    await testConnection();

    // Connect to Redis (non-blocking)
    await connectRedis();

    // Sync database models (only in development)
    if (NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Database models synchronized');
    }

    // Start HTTP server
    server.listen(PORT, () => {
      console.log('✅ Server started successfully');
      console.log(`🌐 Server running on http://localhost:${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log('\nPress CTRL+C to stop\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = server;
