import express from "express";
import { cacheMiddleware } from "../middlewares/middlewareWrappers.js";
import {
  getStickyNotes,
  createStickyNote,
  updateStickyNote,
  deleteStickyNote,
  bulkCreateStickyNotes,
} from "../controllers/stickyNotesController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { stickyNotesLimiter } from "../middlewares/rateLimiter.js";
import redis from "../configs/redisConfig.js";

const router = express.Router();

// ── Fetch (cached) ───────────────────────────────────────────────

/**
 * GET /stickyNotes
 * User's notes — 60s TTL, per-user cache.
 */
router.route("/").get(
  authMiddleware,
  stickyNotesLimiter,
  cacheMiddleware(redis, {
    ttl: 60,
    autoCache: {
      tags: ["sticky-notes"],
      includeAuth: true,
      keyGenerator: (req: any) => {
        const userId = req.user?.userId;
        return `sticky-notes:user:${userId}`;
      },
    },
  }),
  getStickyNotes,
);

// ── Mutations (rate limited, no cache) ──────────────────────────

router.route("/").post(authMiddleware, stickyNotesLimiter, createStickyNote);

router
  .route("/bulk")
  .post(authMiddleware, stickyNotesLimiter, bulkCreateStickyNotes);

router.route("/:id").put(authMiddleware, stickyNotesLimiter, updateStickyNote);

router
  .route("/:id")
  .delete(authMiddleware, stickyNotesLimiter, deleteStickyNote);

export default router;
