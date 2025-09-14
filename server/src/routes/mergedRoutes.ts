import express from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import problemRoutes from "./problemRoutes.js";
import submissionRoutes from "./submissionRoutes.js";
import interviewRoutes from "./interviewRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/problem", problemRoutes);
router.use("/submission", submissionRoutes);
router.use("/interview", interviewRoutes);

export default router;
