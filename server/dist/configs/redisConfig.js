import { createStandaloneRedisClient } from "@periodic/osmium";
import logger from "./loggerConfig.js";
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is not set");
}
const url = new URL(redisUrl);
// ── Existing ioredis client ───────────────────────────────────────────────────
// Used by @periodic/osmium for rate limiting and caching.
// Unchanged from before.
const redis = createStandaloneRedisClient({
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
});
redis.on("ready", () => {
    logger.info("Redis Cloud connected successfully");
});
redis.on("error", (err) => {
    logger.error("Redis connection error:", err.message);
});
redis.on("reconnecting", () => {
    logger.warn("Redis reconnecting...");
});
// ── BullMQ connection options ─────────────────────────────────────────────────
// BullMQ requires a plain ConnectionOptions object — not a client instance —
// because it manages its own internal connections for queues, workers, and
// QueueEvents. It reads the same REDIS_URL so it points at the same DB.
export const redisConnection = {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
    // Redis Cloud requires TLS. The empty object enables it with default settings.
    tls: url.protocol === "rediss:" ? {} : undefined,
};
export default redis;
