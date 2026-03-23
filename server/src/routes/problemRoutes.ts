import express from "express";
import { cacheMiddleware } from "../middlewares/middlewareWrappers.js";
import {
  addEditorials,
  addHints,
  addTestCases,
  createProblem,
  generateHints,
  getEditorialByProblemTitle,
  getProblemByTitle,
  getProblemReactions,
  getProblems,
  getTestCases,
  problemReaction,
  searchProblems,
} from "../controllers/problemController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  generateHintsLimiter,
  reactionLimiter,
  readLimiter,
} from "../middlewares/rateLimiter.js";
import redis from "../configs/redisConfig.js";

const router = express.Router();

// ── Admin / Write routes (no cache) ─────────────────────────────

router.route("/createProblem").post(readLimiter, createProblem);
router.route("/hints").post(readLimiter, addHints);
router.route("/addEditorials").post(readLimiter, addEditorials);
router.route("/testCases").post(readLimiter, addTestCases);

// ── AI hint generation ───────────────────────────────────────────

/** POST /problem/getHints — Gemini call, rate limited */
router.route("/getHints").post(generateHintsLimiter, generateHints);

// ── Reactions (mutations — no cache) ────────────────────────────

router.post("/reaction", authMiddleware, reactionLimiter, problemReaction);

// ── Reads (cached) ───────────────────────────────────────────────

/**
 * GET /problem/getProblems — paginated problem list
 * 10 min TTL — problem list is stable.
 */
router.route("/getProblems").get(
  readLimiter,
  cacheMiddleware(redis, {
    ttl: 600, // 10 minutes
    autoCache: {
      tags: ["problems:list"],
      keyGenerator: (req: any) => {
        const { page, difficulty, status, tags } = req.query;
        return `problems:list:page:${page || 1}:diff:${difficulty || "all"}:status:${status || "all"}:tags:${tags || ""}`;
      },
    },
  }),
  getProblems,
);

/**
 * GET /problem/searchProblems
 * 5 min TTL — search results are reasonably stable.
 */
router.route("/searchProblems").get(
  readLimiter,
  cacheMiddleware(redis, {
    ttl: 300,
    autoCache: {
      tags: ["problems:search"],
      keyGenerator: (req: any) => `problems:search:${req.query.query}`,
    },
  }),
  searchProblems,
);

/**
 * GET /problem/problemDetail
 * 1 hour TTL — problem content almost never changes.
 */
router.route("/problemDetail").get(
  readLimiter,
  cacheMiddleware(redis, {
    ttl: 3600, // 1 hour
    autoCache: {
      tags: (req: any) => ["problems", `problem:${req.query.title}`],
      keyGenerator: (req: any) => `problem:detail:${req.query.title}`,
    },
  }),
  getProblemByTitle,
);

/**
 * GET /problem/getEditorials
 * 6 hour TTL — editorials are written once.
 */
router.route("/getEditorials").get(
  readLimiter,
  cacheMiddleware(redis, {
    ttl: 21600, // 6 hours
    autoCache: {
      tags: (req: any) => ["editorials", `editorial:${req.query.title}`],
      keyGenerator: (req: any) => `editorial:${req.query.title}`,
    },
  }),
  getEditorialByProblemTitle,
);

/**
 * GET /problem/getTestCases
 * 1 hour TTL — test cases are stable.
 */
router.route("/getTestCases").get(
  readLimiter,
  cacheMiddleware(redis, {
    ttl: 3600,
    autoCache: {
      tags: (req: any) => [`problem:testcases:${req.query.title}`],
      keyGenerator: (req: any) => `problem:testcases:${req.query.title}`,
    },
  }),
  getTestCases,
);

/**
 * GET /problem/getProblemReactions
 * 30s TTL — reactions update in near real-time.
 */
router.get(
  "/getProblemReactions",
  authMiddleware,
  readLimiter,
  cacheMiddleware(redis, {
    ttl: 30,
    autoCache: {
      tags: (req: any) => [`problem:reactions:${req.query.title}`],
      includeAuth: true,
      keyGenerator: (req: any) => {
        const userId = req.user?.userId;
        return `problem:reactions:${req.query.title}:user:${userId}`;
      },
    },
  }),
  getProblemReactions,
);

export default router;
