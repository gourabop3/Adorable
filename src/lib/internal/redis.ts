import { Redis } from "redis";

let redisClient: Redis | null = null;
let redisPublisher: Redis | null = null;

const createRedisClient = () => {
  try {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    return Redis.createClient({ url });
  } catch (error) {
    console.warn("Redis connection failed, using in-memory fallback:", error);
    return null;
  }
};

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
};

export const getRedisPublisher = () => {
  if (!redisPublisher) {
    redisPublisher = createRedisClient();
  }
  return redisPublisher;
};

// Fallback in-memory storage for when Redis is unavailable
const inMemoryStorage = new Map<string, string>();

export const setKey = async (key: string, value: string, ttl?: number) => {
  try {
    const client = getRedisClient();
    if (client) {
      if (ttl) {
        await client.setEx(key, ttl, value);
      } else {
        await client.set(key, value);
      }
    } else {
      inMemoryStorage.set(key, value);
    }
  } catch (error) {
    console.warn("Redis set failed, using in-memory fallback:", error);
    inMemoryStorage.set(key, value);
  }
};

export const getKey = async (key: string): Promise<string | null> => {
  try {
    const client = getRedisClient();
    if (client) {
      return await client.get(key);
    } else {
      return inMemoryStorage.get(key) || null;
    }
  } catch (error) {
    console.warn("Redis get failed, using in-memory fallback:", error);
    return inMemoryStorage.get(key) || null;
  }
};

export const deleteKey = async (key: string) => {
  try {
    const client = getRedisClient();
    if (client) {
      await client.del(key);
    } else {
      inMemoryStorage.delete(key);
    }
  } catch (error) {
    console.warn("Redis delete failed, using in-memory fallback:", error);
    inMemoryStorage.delete(key);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  if (redisClient) {
    await redisClient.quit();
  }
  if (redisPublisher) {
    await redisPublisher.quit();
  }
});
