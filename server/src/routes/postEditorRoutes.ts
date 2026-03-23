import express from "express";
import { upload } from "../services/uploadService.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { uploadPostImage } from "../controllers/postEditorController.js";
import { uploadLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// POST /api/postEditor/upload-image
router
  .route("/upload-image")
  .post(authMiddleware, uploadLimiter, upload.single("file"), uploadPostImage);

export default router;
