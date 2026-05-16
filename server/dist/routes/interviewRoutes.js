import express from "express";
import { cacheMiddleware } from "@periodic/osmium";
import { generateFeedback, generateInterview, getFeedbackByInterviewId, getFeedbackHistory, getInterviewDetails, getInterviewsByUserId, getLatestInterviews, } from "../controllers/interviewController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { generateFeedbackLimiter, generateInterviewLimiter, interviewReadLimiter, } from "../middlewares/rateLimiter.js";
import redis from "../configs/redisConfig.js";
const router = express.Router();
// ── AI Mutations (rate limited, no cache) ───────────────────────────────────
router
    .route("/generate-interview")
    .post(generateInterviewLimiter, generateInterview);
router
    .route("/generateFeedback")
    .post(authMiddleware, generateFeedbackLimiter, generateFeedback);
// ── Reads (cached) ───────────────────────────────────────────────────────────
/**
 * GET /interview/getInterviewsByUserId
 * User's own interview list — 5 min TTL.
 */
router.route("/getInterviewsByUserId").get(authMiddleware, interviewReadLimiter, cacheMiddleware(redis, {
    ttl: 300,
    autoCache: {
        tags: ["interviews:list"],
        includeAuth: true,
        keyGenerator: (req) => {
            const userId = req.user?.userId;
            return `interviews:user:${userId}`;
        },
    },
}), getInterviewsByUserId);
/**
 * GET /interview/getLatestInterviews
 * Latest interviews from other users — 5 min TTL.
 */
router.route("/getLatestInterviews").get(authMiddleware, interviewReadLimiter, cacheMiddleware(redis, {
    ttl: 300,
    autoCache: {
        tags: ["interviews:latest"],
        keyGenerator: (req) => {
            const userId = req.user?.userId;
            return `interviews:latest:excluding:${userId}`;
        },
    },
}), getLatestInterviews);
/**
 * GET /interview/getInterviewDetails
 * Single interview details — 1 hour TTL.
 */
router.route("/getInterviewDetails").get(authMiddleware, interviewReadLimiter, cacheMiddleware(redis, {
    ttl: 3600,
    autoCache: {
        tags: (req) => ["interviews", `interview:${req.query.id}`],
        keyGenerator: (req) => `interview:detail:${req.query.id}`,
    },
}), getInterviewDetails);
/**
 * GET /interview/getFeedbackByInterviewId
 * Interview feedback — 1 hour TTL.
 */
router.route("/getFeedbackByInterviewId").get(authMiddleware, interviewReadLimiter, cacheMiddleware(redis, {
    ttl: 3600,
    autoCache: {
        tags: (req) => [
            "interviews:feedback",
            `interview:${req.query.id}:feedback`,
        ],
        keyGenerator: (req) => `interview:feedback:${req.query.id}`,
    },
}), getFeedbackByInterviewId);
/**
 * GET /interview/getFeedbackHistory
 * NEW — score history + platform stats for charts.
 * 10 min TTL (updates as user completes more interviews).
 */
router.route("/getFeedbackHistory").get(authMiddleware, interviewReadLimiter, cacheMiddleware(redis, {
    ttl: 600,
    autoCache: {
        tags: (req) => [
            "interviews:feedback:history",
            `interview:${req.query.interviewId}:history`,
        ],
        keyGenerator: (req) => {
            const userId = req.user?.userId;
            return `interview:history:${userId}:${req.query.interviewId}`;
        },
    },
}), getFeedbackHistory);
export default router;
