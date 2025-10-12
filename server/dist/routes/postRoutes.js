import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { checkCommentTagsUsingAI, createPost, fetchTagsFromCloudinary, getDraftPosts, getMarkdownEditorBasePostFormat, getPostReactions, getPosts, postReaction, uploadTagsToCloudinary, } from "../controllers/postController.js";
const router = express.Router();
router
    .route("/getBasePostTemplate")
    .get(authMiddleware, getMarkdownEditorBasePostFormat);
router.route("/upload").post(uploadTagsToCloudinary);
router.route("/fetch").get(fetchTagsFromCloudinary);
router.route("/validateTag").post(checkCommentTagsUsingAI);
router.route("/createPost").post(authMiddleware, createPost);
router.route("/getPosts").get(authMiddleware, getPosts);
router.route("/getDraftPosts").get(authMiddleware, getDraftPosts);
router.route("/postReaction").post(authMiddleware, postReaction);
router.route("/getPostReactions").get(authMiddleware, getPostReactions);
export default router;
