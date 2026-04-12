import { createRedisClient } from "@periodic/osmium";
import Redis from "ioredis";
import logger from "./loggerConfig.js";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is not set");
}

const url = new URL(redisUrl);

const redis = createRedisClient({
  host: url.hostname,
  port: Number(url.port) || 6379,
  password: url.password || undefined,
}) as Redis;

// Log connection lifecycle
(redis as any).on("ready", () => {
  logger.info("Redis Cloud connected successfully");
});

(redis as any).on("error", (err: Error) => {
  logger.error("Redis connection error:", err.message);
});

(redis as any).on("reconnecting", () => {
  logger.warn("Redis reconnecting...");
});

export default redis;
