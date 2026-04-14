import logger from "../configs/loggerConfig.js";
import { createUser, verifyUser, createMagicLinkToken, verifyMagicLinkToken, createPasswordResetToken, resetUserPassword, } from "../services/authService.js";
import { generateAccessTokenAndSetCookie, generateRefreshTokenAndSetCookie, } from "../utils/tokenAndCookie.js";
import prisma from "../configs/db.js";
import { MailtrapClient } from "mailtrap";
import { magicLinkEmail } from "../emails/magicLinkEmail.js";
import { forgotPasswordEmail } from "../emails/forgotPasswordEmail.js";
import { passwordResetSuccessEmail } from "../emails/passwordResetSuccessEmail.js";
// ---------- Mailtrap client --------------------------------------------------
const mailtrap = new MailtrapClient({
    token: process.env.MAILTRAP_TOKEN,
    testInboxId: Number(process.env.MAILTRAP_INBOX_ID),
});
const sendEmail = async (to, subject, html) => {
    await mailtrap.testing.send({
        from: { email: "hello@demomailtrap.com", name: "Xcode" },
        to: [{ email: to }],
        subject,
        html,
    });
};
// ---------- Helper: issue tokens and persist refresh token in DB -------------
const issueTokens = async (res, userId) => {
    generateAccessTokenAndSetCookie(res, userId);
    const refreshToken = generateRefreshTokenAndSetCookie(res, userId);
    await prisma.user.update({
        where: { id: userId },
        data: { refreshToken },
    });
};
// ---------- Local Auth -------------------------------------------------------
export const register = async (req, res, next) => {
    const { name, email, password } = req.body;
    try {
        const user = await createUser({ name, email, password });
        await issueTokens(res, user.id);
        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                ...user,
                password: undefined,
                magicLinkToken: undefined,
                magicLinkExpiry: undefined,
                passwordResetToken: undefined,
                passwordResetExpiry: undefined,
            },
        });
    }
    catch (error) {
        logger.error("Error in register controller", error);
        next(error);
    }
};
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await verifyUser({ email, password });
        await issueTokens(res, user.id);
        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                ...user,
                password: undefined,
                magicLinkToken: undefined,
                magicLinkExpiry: undefined,
                passwordResetToken: undefined,
                passwordResetExpiry: undefined,
            },
        });
    }
    catch (error) {
        logger.error("Error in login controller", error);
        next(error);
    }
};
export const logout = async (req, res, next) => {
    try {
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        };
        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);
        res.status(200).json({ success: true, message: "Logged out successfully" });
    }
    catch (error) {
        logger.error("Error in logout controller", error);
        next(error);
    }
};
// ---------- OAuth Callbacks --------------------------------------------------
const handleOAuthCallback = async (req, res, next) => {
    try {
        const user = req.user;
        await issueTokens(res, user.id);
        res.redirect(`${process.env.FRONTEND_URL}/`);
    }
    catch (error) {
        logger.error("Error in OAuth callback handler", error);
        next(error);
    }
};
export const googleCallback = handleOAuthCallback;
export const githubCallback = handleOAuthCallback;
export const linkedinCallback = handleOAuthCallback;
export const discordCallback = handleOAuthCallback;
// ---------- Magic Link -------------------------------------------------------
export const sendMagicLink = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: "Email is required" });
            return;
        }
        const token = await createMagicLinkToken(email);
        const magicLinkUrl = `${process.env.BACKEND_URL}/api/auth/magic-link/verify?token=${token}`;
        await sendEmail(email, "Your Xcode sign-in link", magicLinkEmail({ magicLinkUrl, email }));
        res.status(200).json({
            success: true,
            message: "Magic link sent. Check your email.",
        });
    }
    catch (error) {
        logger.error("Error in sendMagicLink controller", error);
        next(error);
    }
};
export const verifyMagicLink = async (req, res, next) => {
    try {
        const { token } = req.query;
        if (!token) {
            res.status(400).json({ success: false, message: "Token is required" });
            return;
        }
        const user = await verifyMagicLinkToken(token);
        await issueTokens(res, user.id);
        res.redirect(`${process.env.FRONTEND_URL}/`);
    }
    catch (error) {
        logger.error("Error in verifyMagicLink controller", error);
        next(error);
    }
};
// ---------- Forgot Password --------------------------------------------------
export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: "Email is required" });
            return;
        }
        try {
            const { token, user } = await createPasswordResetToken(email);
            const resetUrl = `${process.env.FRONTEND_URL}/?resetToken=${token}`;
            await sendEmail(email, "Reset your Xcode password", forgotPasswordEmail({ resetUrl, name: user.name }));
        }
        catch (serviceError) {
            // Swallow NO_USER silently — prevents email enumeration
            if (serviceError?.status === 404) {
                res.status(200).json({
                    success: true,
                    message: "If an account exists for that email, a reset link has been sent.",
                });
                return;
            }
            // Surface OAuth provider error clearly to the frontend
            if (serviceError?.status === 400) {
                res.status(400).json({
                    success: false,
                    message: serviceError.message,
                });
                return;
            }
            throw serviceError;
        }
        // Always return the same response whether the email exists or not
        res.status(200).json({
            success: true,
            message: "If an account exists for that email, a reset link has been sent.",
        });
    }
    catch (error) {
        logger.error("Error in forgotPassword controller", error);
        next(error);
    }
};
export const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            res.status(400).json({
                success: false,
                message: "Token and new password are required",
            });
            return;
        }
        const user = await resetUserPassword(token, newPassword);
        // Send confirmation email — fire and forget, don't block the response
        sendEmail(user.email, "Your Xcode password has been changed", passwordResetSuccessEmail({ name: user.name })).catch((err) => logger.error("Failed to send password reset success email", err));
        res.status(200).json({
            success: true,
            message: "Password reset successfully. Please sign in with your new password.",
        });
    }
    catch (error) {
        logger.error("Error in resetPassword controller", error);
        next(error);
    }
};
