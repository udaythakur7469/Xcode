import createHttpError from "http-errors";
import prisma from "../configs/db.js";
import logger from "../configs/loggerConfig.js";

export const getLatestSubmissionByUserId = async (userId, problemId) => {
  if (!userId || !problemId) {
    return createHttpError.BadRequest("no userId or problemId provided");
  }

  try {
    const submission = await prisma.submission.findFirst({
      where: {
        userId: Number(userId),
        problemId: Number(problemId),
        status: "accepted",
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, code: true, language: true },
    });

    if (!submission) {
      throw createHttpError.NotFound(
        "no submitted code found for the userId and problemId"
      );
    }

    return submission;
  } catch (error) {
    logger.error("error in getLatestSubmissionByUserId service");
    throw createHttpError.BadRequest("Internal server error");
  }
};
