import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { optionalAuthMiddleware } from "../middlewares/optionalAuthMiddleware.js";
import {
  listContests,
  getContestBySlug,
  registerForContest,
  getContestWorkspace,
  getContestLeaderboard,
  getContestProfile,
  getContestJourney,
  getAchievementCatalog,
} from "../controllers/contestController.js";

const router = express.Router();

// Public browsing — optionalAuthMiddleware populates req.user when a
// session cookie is present but never blocks the request when it isn't,
// so logged-out visitors can still browse contests, view leaderboards,
// and look at profiles.
router.get("/", optionalAuthMiddleware, listContests);
router.get("/leaderboard/:id", optionalAuthMiddleware, getContestLeaderboard);
router.get("/achievements/catalog", optionalAuthMiddleware, getAchievementCatalog);
router.get("/profile/:userId", optionalAuthMiddleware, getContestProfile);
router.get("/journey/:userId", optionalAuthMiddleware, getContestJourney);
// Kept last — a literal path above (e.g. "/leaderboard/:id") would
// otherwise never be reached, since Express would match "leaderboard"
// itself as this route's :slug param first.
router.get("/:slug", optionalAuthMiddleware, getContestBySlug);

// Requires auth.
router.post("/:id/register", authMiddleware, registerForContest);
router.get("/:id/workspace", authMiddleware, getContestWorkspace);

export default router;
