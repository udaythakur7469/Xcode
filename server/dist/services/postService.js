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
        // Return default empty values if no submission found
        if (!submission) {
            return {
                id: 0,
                code: "",
                language: "",
            };
        }
        return submission;
    }
    catch (error) {
        logger.error("error in getLatestSubmissionByUserId service", error);
        throw createHttpError.BadRequest("Internal server error");
    }
};
