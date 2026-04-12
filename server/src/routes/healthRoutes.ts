import express, { RequestHandler } from "express";
import redis from "../configs/redisConfig.js";
import { cacheMiddleware } from "@periodic/osmium";

const router = express.Router();

/**
 * GET /api/health
 * Basic server health — no Redis required
 */
router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /api/health/redis
 * Verifies Redis Cloud connectivity via @periodic/osmium's healthCheck()
 * Handler extracted and typed as RequestHandler to satisfy Express types.
 */
const redisHealthHandler: RequestHandler = async (req: any, res) => {
  try {
    const healthy = await req.cache.healthCheck();

    if (healthy) {
      res.status(200).json({
        status: "ok",
        redis: "connected",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(503).json({
      status: "degraded",
      redis: "unreachable",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      redis: "error",
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
};

router.get(
  "/redis",
  cacheMiddleware(redis, { strategy: "none" }),
  redisHealthHandler,
);

export default router;
