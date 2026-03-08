import express from "express";
import { getStickyNotes, createStickyNote, updateStickyNote, deleteStickyNote, bulkCreateStickyNotes, } from "../controllers/stickyNotesController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
const router = express.Router();
// ─── Fetch & Create ──────────────────────────────────────────────
router.route("/").get(authMiddleware, getStickyNotes);
router.route("/").post(authMiddleware, createStickyNote);
// ─── Bulk create (guest → auth migration) ───────────────────────
router.route("/bulk").post(authMiddleware, bulkCreateStickyNotes);
// ─── Update & Delete ─────────────────────────────────────────────
router.route("/:id").put(authMiddleware, updateStickyNote);
router.route("/:id").delete(authMiddleware, deleteStickyNote);
export default router;
