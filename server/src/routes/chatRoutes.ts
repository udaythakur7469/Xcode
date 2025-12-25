import express from "express";
import { optionalAuthMiddleware } from "../middlewares/optionalAuthMiddleware.js";
import {
  createChat,
  deleteChat,
  getMessages,
  sendMessage,
} from "../controllers/chatController.js";

const router = express.Router();

router.route("/createChat").post(optionalAuthMiddleware, createChat);
router.route("/deleteChat").delete(optionalAuthMiddleware, deleteChat);
router.route("/sendMessage").post(optionalAuthMiddleware, sendMessage);
router.route("/getMessages").get(optionalAuthMiddleware, getMessages);

export default router;
