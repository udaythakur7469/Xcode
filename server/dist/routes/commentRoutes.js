import express from "express";
import { createComment, deleteComment, editComment, getCommentsByPost, getRepliesForComment, reactToComment, } from "../controllers/commentController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
const router = express.Router();
// ─── Comment CRUD ───────────────────────────────────────────────
router.route("/create").post(authMiddleware, createComment);
router.route("/:commentId").patch(authMiddleware, editComment);
router.route("/:commentId").delete(authMiddleware, deleteComment);
// ─── Fetch comments + replies ────────────────────────────────────
// authMiddleware is optional here (used for userReaction lookup)
// If your authMiddleware throws when no token is present,
// create an optionalAuthMiddleware variant that calls next() on missing token.
router.route("/post/:postId").get(authMiddleware, getCommentsByPost);
router.route("/:commentId/replies").get(authMiddleware, getRepliesForComment);
// ─── Reactions ───────────────────────────────────────────────────
router.route("/:commentId/react").post(authMiddleware, reactToComment);
export default router;
