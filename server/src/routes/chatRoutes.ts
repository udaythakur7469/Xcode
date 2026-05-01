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
} from "../controllers/chatController.js";

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

export default router;
