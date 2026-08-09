import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { optionalAuthMiddleware } from "../middlewares/optionalAuthMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import {
  listContests,
  getContestBySlug,
  registerForContest,
  getContestWorkspace,
  getContestLeaderboard,
  getContestProfile,
  getContestJourney,
  awardBadgeManually,
} from "../controllers/contestController.js";

const router = express.Router();

// Public browsing — see the "logged-out /contests" design discussion.
// optionalAuthMiddleware populates req.user when a session cookie is
// present but never blocks the request when it isn't.
router.get("/", optionalAuthMiddleware, listContests);
router.get("/leaderboard/:id", optionalAuthMiddleware, getContestLeaderboard);
router.get("/profile/:userId", optionalAuthMiddleware, getContestProfile);
router.get("/journey/:userId", optionalAuthMiddleware, getContestJourney);
router.get("/:slug", optionalAuthMiddleware, getContestBySlug);

// Requires auth.
router.post("/:id/register", authMiddleware, registerForContest);
router.get("/:id/workspace", authMiddleware, getContestWorkspace);

// Admin only.
router.post("/admin/award-badge", authMiddleware, adminMiddleware, awardBadgeManually);

export default router;
