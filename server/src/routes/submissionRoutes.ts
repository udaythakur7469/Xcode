import express from "express";
import { cacheMiddleware } from "../middlewares/middlewareWrappers.js";
import {
  fetchBaseClassCode,
  getAllSubmissions,
  getUserSubmissions,
  runCode,
  storeBaseClassCode,
  submitCode,
} from "../controllers/submissionController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  readLimiter,
  runCodeLimiter,
  submitCodeLimiter,
  submissionReadLimiter,
} from "../middlewares/rateLimiter.js";
import redis from "../configs/redisConfig.js";

const router = express.Router();

// ── Admin / Write routes ─────────────────────────────────────────

router.route("/add-base-code").post(readLimiter, storeBaseClassCode);

// ── Code execution (expensive — rate limited, never cached) ─────

// router.route("/runCode").post(authMiddleware, runCodeLimiter, runCode);
// router.route("/submitCode").post(authMiddleware, submitCodeLimiter, submitCode);

router.route("/runCode").post(authMiddleware, runCode);
router
  .route("/submitCode")
  .post(
    authMiddleware,
    cacheMiddleware(redis, { strategy: "none" }),
    submitCode,
  );

// ── Reads (cached) ───────────────────────────────────────────────

/**
 * GET /submission/get-base-code
 * Base starter code — 1 hour TTL, stable content.
 */
router.route("/get-base-code").get(
  readLimiter,
  cacheMiddleware(redis, {
    ttl: 3600, // 1 hour
    autoCache: {
      tags: (req: any) => [
        "base-code",
        `base-code:${req.query.problemId}:${req.query.language}`,
      ],
      keyGenerator: (req: any) =>
        `base-code:${req.query.problemId}:${req.query.language}`,
    },
  }),
  fetchBaseClassCode,
);

/**
 * GET /submission/getUserSubmissions
 * User's own submissions — 5 min TTL.
 */
router.route("/getUserSubmissions").get(
  authMiddleware,
  submissionReadLimiter,
  cacheMiddleware(redis, {
    ttl: 300, // 5 minutes
    autoCache: {
      tags: ["submissions:user"],
      includeAuth: true,
      keyGenerator: (req: any) => {
        const userId = req.user?.userId;
        const { page, title } = req.query;
        return `submissions:user:${userId}:title:${title || "all"}:page:${page || 1}`;
      },
    },
  }),
  getUserSubmissions,
);

/**
 * GET /submission/getAllSubmissions
 * All submissions for a problem — 5 min TTL.
 */
router.route("/getAllSubmissions").get(
  authMiddleware,
  submissionReadLimiter,
  cacheMiddleware(redis, {
    ttl: 300,
    autoCache: {
      tags: (req: any) => [
        "submissions:all",
        `submissions:problem:${req.query.title}`,
      ],
      keyGenerator: (req: any) =>
        `submissions:all:${req.query.title}:page:${req.query.page || 1}`,
    },
  }),
  getAllSubmissions,
);

export default router;
