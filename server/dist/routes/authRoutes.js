import express from "express";
import trimRequest from "trim-request";
import { discordCallback, forgotPassword, githubCallback, googleCallback, linkedinCallback, login, logout, register, resetPassword, sendMagicLink, verifyMagicLink } from "../controllers/authController.js";
import { forgotPasswordLimiter, loginLimiter, logoutLimiter, magicLinkLimiter, registerLimiter, } from "../middlewares/rateLimiter.js";
import passport from "../configs/passportConfig.js";
const router = express.Router();
router.route("/register").post(trimRequest.all, registerLimiter, register);
router.route("/login").post(trimRequest.all, loginLimiter, login);
router.route("/logout").post(trimRequest.all, logoutLimiter, logout);
router.route("/magic-link/send").post(trimRequest.all, magicLinkLimiter, sendMagicLink);
router.route("/magic-link/verify").get(verifyMagicLink);
router
    .route("/forgot-password")
    .post(trimRequest.all, forgotPasswordLimiter, forgotPassword);
router.route("/reset-password").post(trimRequest.all, resetPassword);
router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
}));
router.get("/google/callback", passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/?error=google_auth_failed`,
    session: false,
}), googleCallback);
router.get("/github", passport.authenticate("github", { scope: ["user:email"], session: false }));
router.get("/github/callback", passport.authenticate("github", {
    failureRedirect: `${process.env.FRONTEND_URL}/?error=github_auth_failed`,
    session: false,
}), githubCallback);
router.get("/linkedin", (req, res) => {
    const params = new URLSearchParams({
        response_type: "code",
        client_id: process.env.LINKEDIN_CLIENT_ID,
        redirect_uri: `${process.env.BACKEND_URL}/api/auth/linkedin/callback`,
        scope: "openid profile email",
    });
    res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
});
router.get("/linkedin/callback", passport.authenticate("linkedin", {
    failureRedirect: `${process.env.FRONTEND_URL}/?error=linkedin_auth_failed`,
    session: false,
}), linkedinCallback);
router.get("/discord", passport.authenticate("discord", { session: false }));
router.get("/discord/callback", passport.authenticate("discord", {
    failureRedirect: `${process.env.FRONTEND_URL}/?error=discord_auth_failed`,
    session: false,
}), discordCallback);
export default router;
