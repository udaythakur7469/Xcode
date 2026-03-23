import { createRedisClient } from "@periodic/osmium";
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
});
// Log connection lifecycle
redis.on("ready", () => {
    logger.info("✅ Redis Cloud connected successfully");
});
redis.on("error", (err) => {
    logger.error("❌ Redis connection error:", err.message);
});
redis.on("reconnecting", () => {
    logger.warn("🔄 Redis reconnecting...");
});
export default redis;
