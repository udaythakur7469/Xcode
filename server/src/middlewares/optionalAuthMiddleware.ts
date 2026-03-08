import {
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessTokenAndSetCookie,
  generateRefreshTokenAndSetCookie,
} from "../utils/tokenAndCookie.js";
import prisma from "../configs/db.js";
import logger from "../configs/loggerConfig.js";

export const optionalAuthMiddleware = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  try {
    // 1️⃣ Try access token first
    if (accessToken) {
      const accessPayload = verifyAccessToken(accessToken);

      if (accessPayload) {
        req.user = { userId: accessPayload.userId };
        return next();
      }
    }

    // 2️⃣ If no refresh token → unauthenticated
    if (!refreshToken) {
      req.user = null;
      return next();
    }

    // 3️⃣ Verify refresh token
    const refreshPayload = verifyRefreshToken(refreshToken);

    if (!refreshPayload) {
      req.user = null;
      return next();
    }

    // 4️⃣ Check DB
    const user = await prisma.user.findUnique({
      where: { id: refreshPayload.userId },
      select: {
        id: true,
        refreshToken: true,
      },
    });

    if (!user || user.refreshToken !== refreshToken) {
      req.user = null;
      return next();
    }

    // 5️⃣ Rotate tokens
    generateAccessTokenAndSetCookie(res, user.id);
    const newRefreshToken = generateRefreshTokenAndSetCookie(res, user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    req.user = { userId: user.id };

    return next();
  } catch (error) {
    logger.error("error in optionalAuthMiddleware", error);

    req.user = null;
    return next();
  }
};
