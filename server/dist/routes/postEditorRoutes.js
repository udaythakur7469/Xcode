import express from "express";
import { upload } from "../services/uploadService.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { uploadPostImage } from "../controllers/postEditorController.js";
const router = express.Router();
// POST /api/post/upload-image
router
    .route("/upload-image")
    .post(authMiddleware, upload.single("file"), uploadPostImage);
export default router;
