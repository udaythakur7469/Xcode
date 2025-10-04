import createHttpError from "http-errors";
import prisma from "../configs/db.js";
import { getLatestSubmissionByUserId } from "../services/postService.js";
import { getPostTemplate } from "../utils/postBaseFormat.js";
export const fetchCommentTagsFromS3 = (req, res, next) => { };
export const checkCommentTagsUsingAI = (req, res, next) => { };
export const storeMarkdownEditorBasePostFormat = (req, res, next) => { };
export const getMarkdownEditorBasePostFormat = async (req, res, next) => {
    const { title } = req.query;
    try {
        const userId = req.user.id || req.user.userId;
        if (!userId) {
            throw createHttpError.Unauthorized("User not authenticated");
        }
        const problem = await prisma.problem.findFirst({
            where: {
                title: {
                    equals: title,
                    mode: "insensitive",
                },
            },
            select: { id: true },
        });
        if (!problem) {
            throw createHttpError.NotFound("Unable to find ProblemId");
        }
        const latestSubmission = await getLatestSubmissionByUserId(userId, problem.id);
        const formattedPost = getPostTemplate(latestSubmission.code, latestSubmission.language);
        res.status(200).json({
            message: "base post format generated successfully",
            data: formattedPost,
        });
    }
    catch (error) {
        next(error);
    }
};
