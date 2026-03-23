import express from "express";
import trimRequest from "trim-request";
import { login, logout, register } from "../controllers/authController.js";
import { loginLimiter, logoutLimiter, registerLimiter, } from "../middlewares/rateLimiter.js";
const router = express.Router();
router.route("/register").post(trimRequest.all, registerLimiter, register);
router.route("/login").post(trimRequest.all, loginLimiter, login);
router.route("/logout").post(trimRequest.all, logoutLimiter, logout);
export default router;
