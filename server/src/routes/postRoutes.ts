import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { optionalAuthMiddleware } from "../middlewares/optionalAuthMiddleware.js";
import {
  checkCommentTagsUsingAI,
  createPost,
  fetchTagsFromCloudinary,
  getCombinedTags,
  getDraftPostById,
  getDraftPosts,
  getMarkdownEditorBasePostFormat,
  getPostById,
  getPostReactions,
  getPosts,
  manageDraftPost,
  postReaction,
  searchPosts,
  updateDraftPost,
  uploadTagsToCloudinary,
} from "../controllers/postController.js";

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
router.route("/getDraftPostById").get(authMiddleware, getDraftPostById);
router.route("/updateDraftPost").put(authMiddleware, updateDraftPost);
router.route("/manageDraftPost").put(authMiddleware, manageDraftPost);
router.route("/getPostTags").get(getCombinedTags);
router.route("/postReaction").post(authMiddleware, postReaction);
router.route("/getPostReactions").get(authMiddleware, getPostReactions);
router.route("/getPostDataById").get(optionalAuthMiddleware, getPostById);

export default router;
