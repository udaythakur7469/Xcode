import createHttpError from "http-errors";
import validator from "validator";
import prisma from "../configs/db.js";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { uniqueNamesGenerator, adjectives, animals, } from "unique-names-generator";
import { encryptPassword } from "../utils/passwordUtil.js";
const generateDisplayName = () => {
    return uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        separator: " ",
        style: "capital",
        length: 2,
    });
};
export const createUser = async ({ name, email, password, }) => {
    if (!name || !email || !password) {
        throw createHttpError.BadRequest("Please fill all fields");
    }
    if (!validator.isLength(name, {
        min: 2,
        max: 25,
    })) {
        throw createHttpError.BadRequest("Please make sure your name is between 2 and 25 characters");
    }
    if (!validator.isEmail(email)) {
        throw createHttpError.BadRequest("Please enter a valid email address");
    }
    if (!validator.isLength(password, {
        min: 6,
        max: 128,
    })) {
        throw createHttpError.BadRequest("Please make sure your password is between 6 and 128 characters.");
    }
    const checkUser = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });
    if (checkUser) {
        throw createHttpError.BadRequest("This user already exists, please login");
    }
    const encryptedPassword = await encryptPassword(password);
    const user = await prisma.user.create({
        data: {
            name: name,
            email: email,
            password: encryptedPassword,
        },
    });
    return user;
};
export const verifyUser = async ({ email, password, }) => {
    const checkUser = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });
    if (!checkUser) {
        throw createHttpError.BadRequest("InvalidCredentials");
    }
    const passwordMatches = await bcrypt.compare(password, checkUser.password);
    if (!passwordMatches) {
        throw createHttpError.Unauthorized("Invalid password");
    }
    checkUser.lastLogin = new Date();
    return checkUser;
};
export const createMagicLinkToken = async (email) => {
    if (!validator.isEmail(email)) {
        throw createHttpError.BadRequest("Please enter a valid email address");
    }
    // Create user if they don't exist yet (first-time magic link signup)
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                name: generateDisplayName(),
                provider: "magic-link",
            },
        });
    }
    // Generate a secure random token — 32 bytes = 64 hex chars
    const token = crypto.randomBytes(32).toString("hex");
    // Token expires in 15 minutes
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.user.update({
        where: { email },
        data: {
            magicLinkToken: token,
            magicLinkExpiry: expiry,
        },
    });
    return token;
};
export const verifyMagicLinkToken = async (token) => {
    const user = await prisma.user.findFirst({
        where: { magicLinkToken: token },
    });
    if (!user) {
        throw createHttpError.BadRequest("Invalid or expired magic link");
    }
    if (!user.magicLinkExpiry || user.magicLinkExpiry < new Date()) {
        throw createHttpError.BadRequest("Magic link has expired. Please request a new one.");
    }
    // Clear the token immediately after use — one-time only
    await prisma.user.update({
        where: { id: user.id },
        data: {
            magicLinkToken: null,
            magicLinkExpiry: null,
            lastLogin: new Date(),
        },
    });
    return user;
};
export const createPasswordResetToken = async (email) => {
    if (!validator.isEmail(email)) {
        throw createHttpError.BadRequest("Please enter a valid email address");
    }
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success even if user not found — prevents email enumeration
    if (!user) {
        throw createHttpError.NotFound("NO_USER");
    }
    // Block OAuth-only users — they have no password to reset
    if (!user.password && user.provider !== "local") {
        throw createHttpError.BadRequest(`This account uses ${user.provider} login and has no password to reset.`);
    }
    // Generate a secure random token — 32 bytes = 64 hex chars
    const token = crypto.randomBytes(32).toString("hex");
    // Token expires in 30 minutes
    const expiry = new Date(Date.now() + 30 * 60 * 1000);
    await prisma.user.update({
        where: { email },
        data: {
            passwordResetToken: token,
            passwordResetExpiry: expiry,
        },
    });
    return { token, user };
};
export const resetUserPassword = async (token, newPassword) => {
    if (!token) {
        throw createHttpError.BadRequest("Reset token is required");
    }
    if (!validator.isLength(newPassword, { min: 6, max: 128 })) {
        throw createHttpError.BadRequest("Password must be between 6 and 128 characters");
    }
    const user = await prisma.user.findFirst({
        where: { passwordResetToken: token },
    });
    if (!user) {
        throw createHttpError.BadRequest("Invalid or expired reset link");
    }
    if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
        throw createHttpError.BadRequest("Reset link has expired. Please request a new one.");
    }
    const encryptedPassword = await encryptPassword(newPassword);
    // Update password and clear the reset token in a single atomic operation
    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
            password: encryptedPassword,
            passwordResetToken: null,
            passwordResetExpiry: null,
            // Invalidate all existing sessions by clearing refresh token
            refreshToken: null,
        },
    });
    return updatedUser;
};
