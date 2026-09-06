import express from "express";
import { optionalAuthMiddleware } from "../middlewares/optionalAuthMiddleware.js";
import {
  createChat,
  deleteChat,
  getChats,
  getMessages,
  sendMessage,
  abortMessage,
  getMessageById,
  createBranch,
  updateActivePath,
  updateFeedback,
  shareChat,
  getSharedChat,
  forkSharedChat,
  sendChatEmail,
} from "../controllers/chatController.js";
import { searchMessages } from "../controllers/searchController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { readLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// ── Existing routes (unchanged) ──────────────────────────────────────────────
router.route("/createChat").post(optionalAuthMiddleware, createChat);
router.route("/deleteChat").delete(optionalAuthMiddleware, deleteChat);
router.route("/sendMessage").post(optionalAuthMiddleware, sendMessage);
router.route("/getMessages").get(optionalAuthMiddleware, getMessages);
router.route("/getUserChats").get(optionalAuthMiddleware, getChats);
router.route("/abortMessage").post(optionalAuthMiddleware, abortMessage);
router.route("/message/:messageId").get(optionalAuthMiddleware, getMessageById);

// ── New routes for tree branching ────────────────────────────────────────────

// POST /chat/branch
// Creates a new branch (edit or regenerate). Replaces the old regenerate: true path.
router.route("/branch").post(optionalAuthMiddleware, createBranch);

// PATCH /chat/activePath
// Persists the active path when the user navigates between branches.
router.route("/activePath").patch(optionalAuthMiddleware, updateActivePath);

// PATCH /chat/message/:messageId/feedback
// Sets LIKE / DISLIKE / null on an AI message.
router
  .route("/message/:messageId/feedback")
  .patch(optionalAuthMiddleware, updateFeedback);

// GET /chat/searchMessages
// Full-text search across all branches of a chat, or all of a user's chats.
// Powers the AI chat dialog's Text Search panel and Node Search's in-graph
// search. GET /chat/getMessages already returns a chat's full tree (all
// branches, not just activePath) and GET /chat/getUserChats already returns
// the chat list, so this is the only new endpoint the search feature needed.
router.route("/searchMessages").get(optionalAuthMiddleware, searchMessages);

//-----------------------------------------share chat routes----------------------------------------------------------------------

// POST /api/chatShare/share — auth required, creates snapshot, returns shareId
router.route("/share").post(authMiddleware, readLimiter, shareChat);

// GET /api/chatShare/shared/:shareId — NO auth, publicly accessible
router.route("/shared/:shareId").get(readLimiter, getSharedChat);

// POST /api/chatShare/fork — auth required, forks snapshot into user's chats
router.route("/fork").post(authMiddleware, readLimiter, forkSharedChat);

router.post("/email", sendChatEmail);

export default router;
