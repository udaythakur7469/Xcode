import express from "express";
import { cacheMiddleware } from "../middlewares/middlewareWrappers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { optionalAuthMiddleware } from "../middlewares/optionalAuthMiddleware.js";
import { checkCommentTagsUsingAI, createPost, fetchTagsFromCloudinary, getCombinedTags, getDraftPostById, getDraftPosts, getMarkdownEditorBasePostFormat, getPostById, getPostReactions, getPosts, manageDraftPost, postReaction, searchPosts, updateDraftPost, uploadTagsToCloudinary, } from "../controllers/postController.js";
import { createPostLimiter, reactionLimiter, readLimiter, tagUploadLimiter, userReadLimiter, } from "../middlewares/rateLimiter.js";
import redis from "../configs/redisConfig.js";
const router = express.Router();
// ── Base post template (cached) ──────────────────────────────────
/**
 * GET /post/getBasePostTemplate
 * Template rarely changes — 10 min TTL.
 */
router.route("/getBasePostTemplate").get(optionalAuthMiddleware, readLimiter, cacheMiddleware(redis, {
    ttl: 600,
    autoCache: {
        tags: ["post:template"],
        includeAuth: true,
        keyGenerator: (req) => {
            const userId = req.user?.userId || "guest";
            const title = req.query.title || "default";
            return `post:template:${userId}:${title}`;
        },
    },
}), getMarkdownEditorBasePostFormat);
// ── Tag management ───────────────────────────────────────────────
/** POST /post/upload — upload tags to Cloudinary */
router.route("/upload").post(tagUploadLimiter, uploadTagsToCloudinary);
/**
 * GET /post/fetch — fetch tags from Cloudinary
 * Tags change infrequently — 6 hour TTL.
 */
router.route("/fetch").get(readLimiter, cacheMiddleware(redis, {
    ttl: 21600, // 6 hours
    autoCache: {
        tags: ["cloudinary:tags"],
        keyGenerator: () => "cloudinary:post-tags",
    },
}), fetchTagsFromCloudinary);
/** POST /post/validateTag — AI tag validation, no cache */
router.route("/validateTag").post(readLimiter, checkCommentTagsUsingAI);
// ── Post CRUD ────────────────────────────────────────────────────
/** POST /post/createPost */
router
    .route("/createPost")
    .post(authMiddleware, createPostLimiter, cacheMiddleware(redis, { strategy: "none" }), createPost);
/**
 * GET /post/getPosts — paginated post list per problem
 * 60s TTL, tagged by problem.
 */
router.route("/getPosts").get(optionalAuthMiddleware, readLimiter, cacheMiddleware(redis, {
    ttl: 60,
    autoCache: {
        tags: (req) => ["posts", `posts:problem:${req.query.problemTitle}`],
        includeAuth: true,
        keyGenerator: (req) => {
            const userId = req.user?.userId || "guest";
            const { problemTitle, cursor, limit } = req.query;
            return `posts:${problemTitle}:user:${userId}:cursor:${cursor || ""}:limit:${limit || 10}`;
        },
    },
}), getPosts);
/**
 * GET /post/searchPosts — search by title/tag
 * 60s TTL.
 */
router.route("/searchPosts").get(readLimiter, cacheMiddleware(redis, {
    ttl: 60,
    autoCache: {
        tags: ["posts:search"],
        keyGenerator: (req) => {
            const { query, cursor, limit } = req.query;
            return `posts:search:${query}:cursor:${cursor || ""}:limit:${limit || 10}`;
        },
    },
}), searchPosts);
// ── Draft post routes (user-specific, short/no cache) ────────────
router.route("/getDraftPosts").get(authMiddleware, userReadLimiter, cacheMiddleware(redis, {
    ttl: 60,
    autoCache: {
        tags: ["posts:drafts"],
        includeAuth: true,
        keyGenerator: (req) => {
            const userId = req.user?.userId;
            return `posts:drafts:${userId}:${req.query.problemTitle}`;
        },
    },
}), getDraftPosts);
router.route("/getDraftPostById").get(authMiddleware, userReadLimiter, cacheMiddleware(redis, {
    ttl: 60,
    autoCache: {
        tags: ["posts:drafts"],
        includeAuth: true,
        keyGenerator: (req) => {
            const userId = req.user?.userId;
            return `posts:draft:${userId}:${req.query.id}`;
        },
    },
}), getDraftPostById);
router
    .route("/updateDraftPost")
    .put(authMiddleware, createPostLimiter, cacheMiddleware(redis, { strategy: "none" }), updateDraftPost);
router
    .route("/manageDraftPost")
    .put(authMiddleware, createPostLimiter, cacheMiddleware(redis, { strategy: "none" }), manageDraftPost);
// ── Tags combined ────────────────────────────────────────────────
/**
 * GET /post/getPostTags — combined problem + post tags
 * 10 min TTL per problem.
 */
router.route("/getPostTags").get(readLimiter, cacheMiddleware(redis, {
    ttl: 600,
    autoCache: {
        tags: (req) => ["post:tags", `post:tags:${req.query.problemTitle}`],
        keyGenerator: (req) => `post:tags:${req.query.problemTitle}`,
    },
}), getCombinedTags);
// ── Reactions (mutations — no cache) ────────────────────────────
router
    .route("/postReaction")
    .post(authMiddleware, reactionLimiter, cacheMiddleware(redis, { strategy: "none" }), postReaction);
/**
 * GET /post/getPostReactions
 * 30s TTL — reactions can change quickly.
 */
router.route("/getPostReactions").get(authMiddleware, readLimiter, cacheMiddleware(redis, {
    ttl: 30,
    autoCache: {
        tags: (req) => [`post:${req.query.postId}:reactions`],
        includeAuth: true,
        keyGenerator: (req) => {
            const userId = req.user?.userId;
            return `post:reactions:${req.query.postId}:user:${userId}`;
        },
    },
}), getPostReactions);
/**
 * GET /post/getPostDataById
 * Full post data — 5 min TTL.
 */
router.route("/getPostDataById").get(optionalAuthMiddleware, readLimiter, cacheMiddleware(redis, {
    ttl: 300,
    autoCache: {
        tags: (req) => ["posts", `post:${req.query.id}`],
        includeAuth: true,
        keyGenerator: (req) => {
            const userId = req.user?.userId || "guest";
            return `post:${req.query.id}:user:${userId}`;
        },
    },
}), getPostById);
export default router;
