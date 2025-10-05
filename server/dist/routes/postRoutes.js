import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { checkCommentTagsUsingAI, fetchTagsFromCloudinary, getMarkdownEditorBasePostFormat, uploadTagsToCloudinary, } from "../controllers/postController.js";
const router = express.Router();
router
    .route("/getBasePostTemplate")
    .get(authMiddleware, getMarkdownEditorBasePostFormat);
router.route("/upload").post(uploadTagsToCloudinary);
router.route("/fetch").get(fetchTagsFromCloudinary);
router.route("/validateTag").post(checkCommentTagsUsingAI);
export default router;
