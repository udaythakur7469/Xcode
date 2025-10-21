import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  checkCommentTagsUsingAI,
  createPost,
  fetchTagsFromCloudinary,
  getCombinedTags,
  getDraftPosts,
  getMarkdownEditorBasePostFormat,
  getPostReactions,
  getPosts,
  postReaction,
  searchPosts,
  uploadTagsToCloudinary,
} from "../controllers/postController.js";
import { optionalAuthMiddleware } from "../middlewares/optionalAuthMiddleware.js";

const router = express.Router();

router
  .route("/getBasePostTemplate")
  .get(optionalAuthMiddleware, getMarkdownEditorBasePostFormat);

router.route("/upload").post(uploadTagsToCloudinary);
router.route("/fetch").get(fetchTagsFromCloudinary);
router.route("/validateTag").post(checkCommentTagsUsingAI);
router.route("/createPost").post(authMiddleware, createPost);
router.route("/getPosts").get(optionalAuthMiddleware, getPosts);
router.route("/searchPosts").get(searchPosts);
router.route("/getDraftPosts").get(authMiddleware, getDraftPosts);
router.route("/getPostTags").get(getCombinedTags);
router.route("/postReaction").post(authMiddleware, postReaction);
router.route("/getPostReactions").get(authMiddleware, getPostReactions);

export default router;
