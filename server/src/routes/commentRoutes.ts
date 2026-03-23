import express from "express";
import { cacheMiddleware } from "../middlewares/middlewareWrappers.js";
import {
  createComment,
  deleteComment,
  editComment,
  getCommentsByPost,
  getRepliesForComment,
  reactToComment,
} from "../controllers/commentController.js";
import { optionalAuthMiddleware } from "../middlewares/optionalAuthMiddleware.js";
import {
  createCommentLimiter,
  mutateCommentLimiter,
  reactionLimiter,
  readLimiter,
} from "../middlewares/rateLimiter.js";
import redis from "../configs/redisConfig.js";

const router = express.Router();

// ── Comment CRUD (mutations — no cache) ─────────────────────────

router
  .route("/create")
  .post(optionalAuthMiddleware, createCommentLimiter, createComment);

router
  .route("/:commentId")
  .patch(optionalAuthMiddleware, mutateCommentLimiter, editComment);

router
  .route("/:commentId")
  .delete(optionalAuthMiddleware, mutateCommentLimiter, deleteComment);

// ── Reactions (mutation — no cache) ─────────────────────────────

router
  .route("/:commentId/react")
  .post(optionalAuthMiddleware, reactionLimiter, reactToComment);

// ── Reads (cached) ───────────────────────────────────────────────

/**
 * GET /comment/post/:postId
 * Top-level comments for a post — 60s TTL.
 * Tagged so mutations can invalidate them.
 */
router.route("/post/:postId").get(
  optionalAuthMiddleware,
  readLimiter,
  cacheMiddleware(redis, {
    ttl: 60,
    autoCache: {
      tags: (req: any) => ["comments", `post:${req.params.postId}:comments`],
      includeAuth: true, // userReaction differs per user
      keyGenerator: (req: any) => {
        const userId = req.user?.userId || "guest";
        const { limit, cursor } = req.query;
        return `comments:post:${req.params.postId}:user:${userId}:limit:${limit || 10}:cursor:${cursor || ""}`;
      },
    },
  }),
  getCommentsByPost,
);

/**
 * GET /comment/:commentId/replies
 * Replies for a comment — 60s TTL.
 */
router.route("/:commentId/replies").get(
  optionalAuthMiddleware,
  readLimiter,
  cacheMiddleware(redis, {
    ttl: 60,
    autoCache: {
      tags: (req: any) => [
        "comments",
        `comment:${req.params.commentId}:replies`,
      ],
      includeAuth: true,
      keyGenerator: (req: any) => {
        const userId = req.user?.userId || "guest";
        const { limit, cursor, initial } = req.query;
        return `replies:${req.params.commentId}:user:${userId}:initial:${initial}:limit:${limit || 10}:cursor:${cursor || ""}`;
      },
    },
  }),
  getRepliesForComment,
);

export default router;
