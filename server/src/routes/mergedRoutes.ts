import express from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import problemRoutes from "./problemRoutes.js";
import submissionRoutes from "./submissionRoutes.js";
import interviewRoutes from "./interviewRoutes.js";
import postRoutes from "./postRoutes.js";
import chatRoutes from "./chatRoutes.js";
import postEditorRoutes from "./postEditorRoutes.js";
import commentRoutes from "./commentRoutes.js";
import stickyNotesRoutes from "./stickyNotesRoutes.js";
import calenderRoutes from "./calenderRoutes.js";
import healthRoutes from "./healthRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/problem", problemRoutes);
router.use("/submission", submissionRoutes);
router.use("/interview", interviewRoutes);
router.use("/post", postRoutes);
router.use("/chat", chatRoutes);
router.use("/postEditor", postEditorRoutes);
router.use("/comment", commentRoutes);
router.use("/stickyNotes", stickyNotesRoutes);
router.use("/calendar", calenderRoutes);
router.use("/health", healthRoutes);

export default router;
