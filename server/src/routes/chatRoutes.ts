import express from "express";
import { cacheMiddleware } from "../middlewares/middlewareWrappers.js";
import { optionalAuthMiddleware } from "../middlewares/optionalAuthMiddleware.js";
import {
  createChat,
  deleteChat,
  getChats,
  getMessages,
  sendMessage,
  abortMessage,
  getMessageById,
} from "../controllers/chatController.js";
import {
  chatMessageLimiter,
  chatReadLimiter,
  readLimiter,
} from "../middlewares/rateLimiter.js";
import redis from "../configs/redisConfig.js";

const router = express.Router();

// ── Mutations (no cache) ─────────────────────────────────────────

router
  .route("/createChat")
  .post(optionalAuthMiddleware, readLimiter, createChat);

router
  .route("/deleteChat")
  .delete(
    optionalAuthMiddleware,
    readLimiter,
    cacheMiddleware(redis, { strategy: "none" }),
    deleteChat,
  );

router
  .route("/sendMessage")
  .post(
    optionalAuthMiddleware,
    chatMessageLimiter,
    cacheMiddleware(redis, { strategy: "none" }),
    sendMessage,
  );

router
  .route("/abortMessage")
  .post(optionalAuthMiddleware, readLimiter, abortMessage);

// ── Reads (cached) ───────────────────────────────────────────────

/**
 * GET /chat/getMessages
 * Short TTL — messages arrive frequently.
 * Cache is per-user via includeAuth + query params.
 */
router.route("/getMessages").get(
  optionalAuthMiddleware,
  chatReadLimiter,
  cacheMiddleware(redis, {
    ttl: 30, // 30 seconds
    autoCache: {
      tags: ["chat:messages"],
      includeAuth: true,
      keyGenerator: (req: any) => {
        const chatId = req.query.chatId;
        const userId = req.user?.userId || "guest";
        return `chat:messages:${userId}:${chatId}`;
      },
    },
  }),
  getMessages,
);

/**
 * GET /chat/getUserChats
 * Slightly longer TTL — chat list changes less often than messages.
 * Invalidated when sendMessage or deleteChat is called (handled via tags).
 */
router.route("/getUserChats").get(
  optionalAuthMiddleware,
  chatReadLimiter,
  cacheMiddleware(redis, {
    ttl: 60, // 60 seconds
    autoCache: {
      tags: ["chat:list"],
      includeAuth: true,
      keyGenerator: (req: any) => {
        const userId = req.user?.userId || "guest";
        return `chat:list:${userId}`;
      },
    },
  }),
  getChats,
);

/**
 * GET /chat/message/:messageId
 * Individual message — cache for 30s.
 */
router.route("/message/:messageId").get(
  optionalAuthMiddleware,
  chatReadLimiter,
  cacheMiddleware(redis, {
    ttl: 30,
    autoCache: {
      tags: ["chat:messages"],
      includeAuth: true,
      keyGenerator: (req: any) => {
        const userId = req.user?.userId || "guest";
        return `chat:message:${userId}:${req.params.messageId}`;
      },
    },
  }),
  getMessageById,
);

export default router;
