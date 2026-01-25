import express from "express";
import {
  authenticatedUser,
  getUserHeatmapData,
  getUserSolvedLanguages,
  updateProfile,
  updateProfilePicture,
} from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { upload } from "../services/uploadService.js";

const router = express.Router();

router.route("/checkUser").get(authMiddleware, authenticatedUser);
router.route("/profile").patch(authMiddleware, updateProfile);
router
  .route("/profile/picture")
  .patch(authMiddleware, upload.single("picture"), updateProfilePicture);
router.route("/userLanguages").get(authMiddleware, getUserSolvedLanguages);
router.route("/heatmap").get(authMiddleware, getUserHeatmapData);

export default router;
