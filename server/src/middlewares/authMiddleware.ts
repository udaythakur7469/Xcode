import createHttpError from "http-errors";
import {
  generateAccessTokenAndSetCookie,
  generateRefreshTokenAndSetCookie,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/tokenAndCookie.js";
import prisma from "../configs/db.js";
import logger from "../configs/loggerConfig.js";

export const authMiddleware = async (req, res, next) => {
  const accessToken: string = req.cookies.accessToken;
  const refreshToken: string = req.cookies.refreshToken;

  try {
    if (accessToken) {
      const accessTokenPayload = verifyAccessToken(accessToken);

      if (accessTokenPayload) {
        req.user = { userId: accessTokenPayload.userId };
        return next();
      }
    }

    if (!refreshToken) {
      return next(createHttpError.Unauthorized("Authentication required"));
    }

    const refreshTokenPayload = verifyRefreshToken(refreshToken);

    if (!refreshTokenPayload) {
      return next(
        createHttpError.Unauthorized("Invalid session. Please sign in again"),
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: refreshTokenPayload.userId },
      select: {
        id: true,
        refreshToken: true,
      },
    });

    if (!user) {
      return next(
        createHttpError.Unauthorized(
          "Invalid session. Please sign in again",
        ),
      );
    }

    if (user.refreshToken !== refreshToken) {
      return next(
        createHttpError.Unauthorized("Invalid session. Please sign in again"),
      );
    }

    generateAccessTokenAndSetCookie(res, user.id);

    const newRefreshToken = generateRefreshTokenAndSetCookie(res, user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: newRefreshToken,
      },
    });

    req.user = { userId: user.id };
    return next();
  } catch (error) {
    logger.error("error in authMiddleware");
    return next(createHttpError.InternalServerError("Authentication failed"));
  }
};
