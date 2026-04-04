import express from "express";
import { cacheMiddleware } from "../middlewares/middlewareWrappers.js";
import {
  authenticatedUser,
  getUserHeatmapData,
  getUserSolvedLanguages,
  updateProfile,
  updateProfilePicture,
} from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { upload } from "../services/uploadService.js";
import { uploadLimiter, userReadLimiter } from "../middlewares/rateLimiter.js";
import redis from "../configs/redisConfig.js";

const router = express.Router();

// ── Mutations (no cache) ─────────────────────────────────────────

router
  .route("/profile")
  .patch(
    authMiddleware,
    userReadLimiter,
    cacheMiddleware(redis, { strategy: "none" }),
    updateProfile,
  );

router
  .route("/profile/picture")
  .patch(
    authMiddleware,
    uploadLimiter,
    upload.single("picture"),
    cacheMiddleware(redis, { strategy: "none" }),
    updateProfilePicture,
  );

// ── Reads (cached) ───────────────────────────────────────────────

/**
 * GET /user/checkUser
 * Full user profile + stats — 5 min TTL.
 * Per-user cache key.
 */
router.route("/checkUser").get(
  authMiddleware,
  userReadLimiter,
  cacheMiddleware(redis, {
    ttl: 300, // 5 minutes
    autoCache: {
      tags: ["user:profile"],
      includeAuth: true,
      keyGenerator: (req: any) => {
        const userId = req.user?.userId;
        return `user:profile:${userId}`;
      },
    },
  }),
  authenticatedUser,
);

/**
 * GET /user/userLanguages
 * Solved languages breakdown — 5 min TTL.
 */
router.route("/userLanguages").get(
  authMiddleware,
  userReadLimiter,
  cacheMiddleware(redis, {
    ttl: 300,
    autoCache: {
      tags: ["user:languages"],
      includeAuth: true,
      keyGenerator: (req: any) => {
        const userId = req.user?.userId;
        return `user:languages:${userId}`;
      },
    },
  }),
  getUserSolvedLanguages,
);

/**
 * GET /user/heatmap
 * Activity heatmap — 5 min TTL.
 * Heatmap data updates only when user submits code.
 */
router.route("/heatmap").get(
  authMiddleware,
  userReadLimiter,
  cacheMiddleware(redis, {
    ttl: 300,
    autoCache: {
      tags: ["user:heatmap"],
      includeAuth: true,
      keyGenerator: (req: any) => {
        const userId = req.user?.userId;
        return `user:heatmap:${userId}`;
      },
    },
  }),
  getUserHeatmapData,
);

export default router;
