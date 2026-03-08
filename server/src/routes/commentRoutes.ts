import express from "express";
import {
  createComment,
  deleteComment,
  editComment,
  getCommentsByPost,
  getRepliesForComment,
  reactToComment,
} from "../controllers/commentController.js";
import { optionalAuthMiddleware } from "../middlewares/optionalAuthMiddleware.js";

const router = express.Router();

// ─── Comment CRUD ───────────────────────────────────────────────
router.route("/create").post(optionalAuthMiddleware, createComment);
router.route("/:commentId").patch(optionalAuthMiddleware, editComment);
router.route("/:commentId").delete(optionalAuthMiddleware, deleteComment);

// ─── Fetch comments + replies ────────────────────────────────────
// OptionalAuthMiddleware is optional here (used for userReaction lookup)
// If your OptionalAuthMiddleware throws when no token is present,
// create an OptionalAuthMiddleware variant that calls next() on missing token.
router.route("/post/:postId").get(optionalAuthMiddleware, getCommentsByPost);
router.route("/:commentId/replies").get(optionalAuthMiddleware, getRepliesForComment);

// ─── Reactions ───────────────────────────────────────────────────
router.route("/:commentId/react").post(optionalAuthMiddleware, reactToComment);

export default router;
