import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

console.log(`[RedisConnection] Connecting to Redis at: ${redisUrl}`);

export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
  // Reconnection options
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  }
});

redisConnection.on('error', (err) => {
  console.error('[RedisConnection] Redis Error:', err.message || err);
});
