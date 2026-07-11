import redis from "../configs/redisConfig.js";
import { rateLimit } from "@periodic/titanium";
// ─────────────────────────────────────────────────────────────────
// IDENTIFIER HELPER
// Uses userId from JWT if authenticated, falls back to IP address.
// ─────────────────────────────────────────────────────────────────
const identifier = (req) => {
    if (req.user?.userId) {
        return `user:${req.user.userId}`;
    }
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        "unknown";
    return `ip:${ip}`;
};
// ─────────────────────────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────────────────────────
export const registerLimiter = rateLimit({
    redis,
    limit: 5,
    window: 900,
    keyPrefix: "auth:register",
    identifier: (req) => {
        const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
            req.socket?.remoteAddress ||
            "unknown";
        return `ip:${ip}`;
    },
    message: "Too many registration attempts. Please try again in 15 minutes.",
    failStrategy: "open",
});
export const loginLimiter = rateLimit({
    redis,
    limit: 10,
    window: 900,
    keyPrefix: "auth:login",
    identifier: (req) => {
        const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
            req.socket?.remoteAddress ||
            "unknown";
        return `ip:${ip}`;
    },
    message: "Too many login attempts. Please try again in 15 minutes.",
    failStrategy: "open",
});
export const logoutLimiter = rateLimit({
    redis,
    limit: 20,
    window: 60,
    keyPrefix: "auth:logout",
    identifier,
    failStrategy: "open",
});
// ─────────────────────────────────────────────────────────────────
// AI ROUTES
// ─────────────────────────────────────────────────────────────────
export const chatMessageLimiter = rateLimit({
    redis,
    limit: 30,
    window: 60,
    keyPrefix: "ai:chat:message",
    identifier,
    message: "You are sending messages too fast. Please wait a moment.",
    failStrategy: "open",
});
export const generateHintsLimiter = rateLimit({
    redis,
    limit: 10,
    window: 60,
    keyPrefix: "ai:problem:hints",
    identifier,
    message: "Hint generation limit reached. Please wait a minute.",
    failStrategy: "open",
});
export const generateInterviewLimiter = rateLimit({
    redis,
    limit: 5,
    window: 3600,
    keyPrefix: "ai:interview:generate",
    identifier,
    message: "Interview generation limit reached. You can generate 5 per hour.",
    failStrategy: "open",
});
export const generateFeedbackLimiter = rateLimit({
    redis,
    limit: 5,
    window: 3600,
    keyPrefix: "ai:interview:feedback",
    identifier,
    message: "Feedback generation limit reached. You can generate 5 per hour.",
    failStrategy: "open",
});
export const generatePostLimiter = rateLimit({
    redis,
    limit: 10,
    window: 3600,
    keyPrefix: "ai:post:generate",
    identifier,
    message: "Post generation limit reached. You can generate 5 posts per hour.",
    failStrategy: "open",
});
// ─────────────────────────────────────────────────────────────────
// CODE EXECUTION
// ─────────────────────────────────────────────────────────────────
export const runCodeLimiter = rateLimit({
    redis,
    limit: 100,
    window: 60,
    keyPrefix: "judge0:run",
    identifier,
    message: "Code execution limit reached. Please wait before running again.",
    failStrategy: "open",
});
export const submitCodeLimiter = rateLimit({
    redis,
    limit: 100,
    window: 60,
    keyPrefix: "judge0:submit",
    identifier,
    message: "Submission limit reached. Please wait before submitting again.",
    failStrategy: "open",
});
// ─────────────────────────────────────────────────────────────────
// POST / COMMENT MUTATIONS
// ─────────────────────────────────────────────────────────────────
export const createPostLimiter = rateLimit({
    redis,
    limit: 10,
    window: 60,
    keyPrefix: "post:create",
    identifier,
    message: "Post creation limit reached. Please slow down.",
    failStrategy: "open",
});
export const createCommentLimiter = rateLimit({
    redis,
    limit: 20,
    window: 60,
    keyPrefix: "comment:create",
    identifier,
    message: "Comment limit reached. Please wait a moment.",
    failStrategy: "open",
});
export const mutateCommentLimiter = rateLimit({
    redis,
    limit: 30,
    window: 60,
    keyPrefix: "comment:mutate",
    identifier,
    failStrategy: "open",
});
export const reactionLimiter = rateLimit({
    redis,
    limit: 60,
    window: 60,
    keyPrefix: "reaction",
    identifier,
    message: "Slow down on the reactions!",
    failStrategy: "open",
});
// ─────────────────────────────────────────────────────────────────
// STICKY NOTES
// ─────────────────────────────────────────────────────────────────
export const stickyNotesLimiter = rateLimit({
    redis,
    limit: 60,
    window: 60,
    keyPrefix: "sticky-notes:mutate",
    identifier,
    failStrategy: "open",
});
// ─────────────────────────────────────────────────────────────────
// READ ROUTES
// ─────────────────────────────────────────────────────────────────
export const readLimiter = rateLimit({
    redis,
    limit: 300,
    window: 60,
    keyPrefix: "read:general",
    identifier,
    failStrategy: "open",
});
export const submissionReadLimiter = rateLimit({
    redis,
    limit: 60,
    window: 60,
    keyPrefix: "read:submissions",
    identifier,
    failStrategy: "open",
});
export const userReadLimiter = rateLimit({
    redis,
    limit: 60,
    window: 60,
    keyPrefix: "read:user",
    identifier,
    failStrategy: "open",
});
export const interviewReadLimiter = rateLimit({
    redis,
    limit: 60,
    window: 60,
    keyPrefix: "read:interview",
    identifier,
    failStrategy: "open",
});
export const chatReadLimiter = rateLimit({
    redis,
    limit: 60,
    window: 60,
    keyPrefix: "read:chat",
    identifier,
    failStrategy: "open",
});
// ─────────────────────────────────────────────────────────────────
// UPLOADS
// ─────────────────────────────────────────────────────────────────
export const uploadLimiter = rateLimit({
    redis,
    limit: 10,
    window: 60,
    keyPrefix: "upload:image",
    identifier,
    message: "Upload limit reached. Please wait before uploading again.",
    failStrategy: "open",
});
export const tagUploadLimiter = rateLimit({
    redis,
    limit: 5,
    window: 60,
    keyPrefix: "upload:tags",
    identifier,
    failStrategy: "open",
});
export const magicLinkLimiter = rateLimit({
    redis,
    limit: 5,
    window: 3600,
    keyPrefix: "auth:magic-link",
    identifier: (req) => {
        const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
            req.socket?.remoteAddress ||
            "unknown";
        return `ip:${ip}`;
    },
    message: "Too many magic link requests. Please try again in an hour.",
    failStrategy: "open",
});
export const forgotPasswordLimiter = rateLimit({
    redis,
    limit: 5,
    window: 3600,
    keyPrefix: "auth:forgot-password",
    identifier: (req) => {
        const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
            req.socket?.remoteAddress ||
            "unknown";
        return `ip:${ip}`;
    },
    message: "Too many password reset requests. Please try again in an hour.",
    failStrategy: "open",
});
