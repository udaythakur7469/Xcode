import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getMarkdownEditorBasePostFormat } from "../controllers/postController.js";
const router = express.Router();
router
    .route("/getBasePostTemplate")
    .get(authMiddleware, getMarkdownEditorBasePostFormat);
export default router;
