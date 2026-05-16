import express from "express";
import { cacheMiddleware } from "@periodic/osmium";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { optionalAuthMiddleware } from "../middlewares/optionalAuthMiddleware.js";
import { readLimiter } from "../middlewares/rateLimiter.js";
import redis from "../configs/redisConfig.js";
import { getActivityData, getDayStats, getPotd, getRangeStats, getRevisionQueue } from "../controllers/calenderController.js";
const router = express.Router();
router.get("/activity", authMiddleware, readLimiter, cacheMiddleware(redis, {
    ttl: 300,
    autoCache: {
        tags: ["calendar:activity"],
        includeAuth: true,
        keyGenerator: (req) => `calendar:activity:user:${req.user?.userId ?? req.user?.id}`,
    },
}), getActivityData);
router.get("/dayStats", authMiddleware, readLimiter, cacheMiddleware(redis, {
    ttl: 120,
    autoCache: {
        tags: ["calendar:dayStats"],
        includeAuth: true,
        keyGenerator: (req) => `calendar:dayStats:user:${req.user?.userId ?? req.user?.id}:date:${req.query.date}`,
    },
}), getDayStats);
router.get("/rangeStats", authMiddleware, readLimiter, cacheMiddleware(redis, {
    ttl: 120,
    autoCache: {
        tags: ["calendar:rangeStats"],
        includeAuth: true,
        keyGenerator: (req) => `calendar:rangeStats:user:${req.user?.userId ?? req.user?.id}:from:${req.query.from}:to:${req.query.to}`,
    },
}), getRangeStats);
router.get("/potd", optionalAuthMiddleware, readLimiter, cacheMiddleware(redis, {
    ttl: 3600,
    autoCache: {
        tags: ["calendar:potd"],
        keyGenerator: (req) => {
            const today = new Date().toISOString().slice(0, 10);
            return `calendar:potd:${today}`;
        },
    },
}), getPotd);
router.get("/revisionQueue", authMiddleware, readLimiter, cacheMiddleware(redis, {
    ttl: 300,
    autoCache: {
        tags: ["calendar:revision"],
        includeAuth: true,
        keyGenerator: (req) => `calendar:revision:user:${req.user?.userId ?? req.user?.id}`,
    },
}), getRevisionQueue);
export default router;
