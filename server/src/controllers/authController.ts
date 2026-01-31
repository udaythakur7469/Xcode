import { Request, Response, NextFunction } from "express";
import logger from "../configs/loggerConfig.js";
import { createUser, verifyUser } from "../services/authService.js";
import { generateAccessTokenAndSetCookie, generateRefreshTokenAndSetCookie } from "../utils/tokenAndCookie.js";
import prisma from "../configs/db.js";

interface authUserInput {
  email: string;
  password: string;
}

interface CreateUserInput extends authUserInput {
  name: string;
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { name, email, password }: CreateUserInput = req.body;
  try {
    const User = await createUser({ name, email, password });

    const accessToken = generateAccessTokenAndSetCookie(res, User.id);

    const refreshToken = generateRefreshTokenAndSetCookie(res, User.id);

    await prisma.user.update({
      where: {
        email: email,
      },
      data: { refreshToken: refreshToken },
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        ...User,
        token: undefined,
        password: undefined,
      },
    });
  } catch (error) {
    logger.error("error in register controller", error);
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password }: authUserInput = req.body;

    const checkUser = await verifyUser({ email, password });

    generateAccessTokenAndSetCookie(res, checkUser.id);

    generateRefreshTokenAndSetCookie(res, checkUser.id);

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        ...checkUser,
        password: undefined,
      },
    });
  } catch (error) {
    logger.error("error in login controller", error);
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    logger.error("error in logout controller", error);
    next(error);
  }
};
