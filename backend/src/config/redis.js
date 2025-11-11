const redis = require('redis');
const dotenv = require('dotenv');

dotenv.config();

// Create Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Too many Redis reconnection attempts');
        return new Error('Too many retries');
      }
      return retries * 100; // Exponential backoff
    }
  }
});

// Error handling
redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis client connected');
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('reconnecting', () => {
  console.log('⚠️  Redis client reconnecting...');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('✅ Redis connection established successfully');
  } catch (error) {
    console.error('❌ Unable to connect to Redis:', error);
    // Don't exit - Redis is optional for basic functionality
  }
};

// Helper functions
const cacheHelpers = {
  // Get cached value
  async get(key) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  },

  // Set cached value with expiration (in seconds)
  async set(key, value, expirationSeconds = 3600) {
    try {
      await redisClient.setEx(key, expirationSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  },

  // Delete cached value
  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  },

  // Check if key exists
  async exists(key) {
    try {
      return await redisClient.exists(key);
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  },

  // Set with pattern-based expiration
  async setWithTTL(key, value, ttl) {
    try {
      await redisClient.set(key, JSON.stringify(value), {
        EX: ttl
      });
      return true;
    } catch (error) {
      console.error('Redis SET with TTL error:', error);
      return false;
    }
  }
};

module.exports = { redisClient, connectRedis, cacheHelpers };
