import express from "express";
import {
  generateFeedback,
  generateInterview,
  getFeedbackByInterviewId,
  getInterviewDetails,
  getInterviewsByUserId,
  getLatestInterviews,
} from "../controllers/interviewController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/generate-interview").post(generateInterview);
router
  .route("/getInterviewsByUserId")
  .get(authMiddleware, getInterviewsByUserId);
router.route("/getLatestInterviews").get(authMiddleware, getLatestInterviews);
router.route("/getInterviewDetails").get(authMiddleware, getInterviewDetails);
router.route("/generateFeedback").post(authMiddleware, generateFeedback);
router
  .route("/getFeedbackByInterviewId")
  .get(authMiddleware, getFeedbackByInterviewId);

export default router;
