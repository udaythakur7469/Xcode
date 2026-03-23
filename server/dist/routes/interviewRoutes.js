import express from "express";
import { cacheMiddleware } from "../middlewares/middlewareWrappers.js";
import { generateFeedback, generateInterview, getFeedbackByInterviewId, getInterviewDetails, getInterviewsByUserId, getLatestInterviews, } from "../controllers/interviewController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { generateFeedbackLimiter, generateInterviewLimiter, interviewReadLimiter, } from "../middlewares/rateLimiter.js";
import redis from "../configs/redisConfig.js";
const router = express.Router();
// ── AI Mutations (rate limited, no cache) ───────────────────────
router
    .route("/generate-interview")
    .post(generateInterviewLimiter, generateInterview);
router
    .route("/generateFeedback")
    .post(authMiddleware, generateFeedbackLimiter, generateFeedback);
// ── Reads (cached) ───────────────────────────────────────────────
/**
 * GET /interview/getInterviewsByUserId
 * User's own interview list — 5 min TTL.
 */
router.route("/getInterviewsByUserId").get(authMiddleware, interviewReadLimiter, cacheMiddleware(redis, {
    ttl: 300, // 5 minutes
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
 * Single interview — 1 hour TTL (content doesn't change once created).
 */
router.route("/getInterviewDetails").get(authMiddleware, interviewReadLimiter, cacheMiddleware(redis, {
    ttl: 3600, // 1 hour
    autoCache: {
        tags: (req) => ["interviews", `interview:${req.query.id}`],
        keyGenerator: (req) => `interview:detail:${req.query.id}`,
    },
}), getInterviewDetails);
/**
 * GET /interview/getFeedbackByInterviewId
 * Interview feedback — 1 hour TTL (feedback is immutable once generated).
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
export default router;
