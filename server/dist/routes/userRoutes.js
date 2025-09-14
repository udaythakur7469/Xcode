import express from "express";
import { authenticatedUser, getUserHeatmapData, getUserSolvedLanguages, updateProfile, } from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
const router = express.Router();
router.route("/checkUser").get(authMiddleware, authenticatedUser);
router.route("/profile").patch(authMiddleware, updateProfile);
router.route("/userLanguages").get(authMiddleware, getUserSolvedLanguages);
router.route("/heatmap").get(authMiddleware, getUserHeatmapData);
export default router;
