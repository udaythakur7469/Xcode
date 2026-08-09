import createHttpError from "http-errors";
import prisma from "../configs/db.js";

// authMiddleware only puts { userId } on req.user (role isn't in the JWT
// payload), so this does one extra lookup rather than trusting a claim
// that could go stale if a user's role changes between token refreshes.
export const adminMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.id ?? req.user?.userId;
    if (!userId) {
      return next(createHttpError.Unauthorized("Authentication required"));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return next(createHttpError.Forbidden("Admin access required"));
    }

    return next();
  } catch (err) {
    return next(err);
  }
};
