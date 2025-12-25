import express from "express";
import {
  addEditorials,
  addHints,
  addTestCases,
  createProblem,
  generateHints,
  getEditorialByProblemTitle,
  getProblemByTitle,
  getProblemReactions,
  getProblems,
  getTestCases,
  problemReaction,
  searchProblems,
} from "../controllers/problemController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/createProblem").post(createProblem);
router.route("/getProblems").get(getProblems);
router.route("/searchProblems").get(searchProblems);
router.route("/problemDetail").get(getProblemByTitle);
router.route("/hints").post(addHints);
router.route("/addEditorials").post(addEditorials);
router.route("/getEditorials").get(getEditorialByProblemTitle);
router.post("/reaction", authMiddleware, problemReaction);
router.get("/getProblemReactions", authMiddleware, getProblemReactions);
router.route("/testCases").post(addTestCases);
router.route("/getTestCases").get(getTestCases);
router.route("/getHints").post(generateHints);

export default router;
