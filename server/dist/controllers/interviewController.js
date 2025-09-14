import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";
import logger from "../configs/loggerConfig.js";
import createHttpError from "http-errors";
import prisma from "../configs/db.js";
import { feedbackSchema } from "../utils/feedbackUtil.js";
export const generateInterview = async (req, res, next) => {
    const { type, role, level, techstack, amount } = req.body;
    if (!req.user) {
        return res
            .status(401)
            .json({ error: "Unauthorized: User not authenticated" });
    }
    const userId = req.user.id || req.user.userId;
    if (!type || !role || !level || !techstack || !amount) {
        return createHttpError.BadRequest("Missing required fields");
    }
    const validTypes = ["TECHNICAL", "BEHAVIORAL", "MIXED"];
    const upperType = type.toUpperCase();
    if (!validTypes.includes(upperType)) {
        return next(createHttpError.BadRequest("Invalid interview type"));
    }
    try {
        const { text: questions } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioral and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Thank you! <3
    `,
        });
        const interview = await prisma.interview.create({
            data: {
                userId: userId,
                role: role,
                type: type.toUpperCase(),
                amount: amount,
                techStack: techstack.split(",").map((t) => t.trim()),
                level: level,
                questions: JSON.parse(questions),
                finalized: true,
            },
        });
        return res.json(interview);
    }
    catch (error) {
        logger.error("error in fetching user interviews", error);
        next(error);
    }
};
export const getInterviewsByUserId = async (req, res, next) => {
    if (!req.user) {
        return res
            .status(401)
            .json({ error: "Unauthorized: User not authenticated" });
    }
    const userId = req.user.id || req.user.userId;
    try {
        const interviews = await prisma.interview.findMany({
            where: {
                userId: userId,
            },
            select: {
                id: true,
                role: true,
                type: true,
                techStack: true,
                finalized: true,
                feedbackFinalized: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.status(200).json(interviews);
    }
    catch (error) {
        logger.error("error in generating interview", error);
        next(error);
    }
};
export const getLatestInterviews = async (req, res, next) => {
    if (!req.user) {
        return res
            .status(401)
            .json({ error: "Unauthorized: User not authenticated" });
    }
    const userId = req.user.id || req.user.userId;
    try {
        const interviews = await prisma.interview.findMany({
            where: {
                userId: { not: userId },
            },
            select: {
                id: true,
                role: true,
                type: true,
                techStack: true,
                finalized: true,
                feedbackFinalized: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.status(200).json(interviews);
    }
    catch (error) {
        logger.error("error in generating interview", error);
        next(error);
    }
};
export const getInterviewDetails = async (req, res, next) => {
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ message: "Interview ID is required" });
    }
    if (!req.user) {
        return res
            .status(401)
            .json({ error: "Unauthorized: User not authenticated" });
    }
    const numericId = Number(id);
    try {
        const interview = await prisma.interview.findUnique({
            where: { id: numericId },
            select: {
                id: true,
                role: true,
                type: true,
                level: true,
                techStack: true,
                finalized: true,
                feedbackFinalized: true,
                questions: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return res.status(200).json(interview);
    }
    catch (error) {
        logger.error("error in generating interview", error);
        next(error);
    }
};
export const generateFeedback = async (req, res, next) => {
    const { id, transcript } = req.body;
    if (!id) {
        return res.status(400).json({ message: "Interview ID is required" });
    }
    if (!req.user) {
        return res
            .status(401)
            .json({ error: "Unauthorized: User not authenticated" });
    }
    const userId = Number(req.user.id || req.user.userId);
    try {
        const formattedTranscript = transcript
            .map((sentence) => `- ${sentence.role}: ${sentence.content}\n`)
            .join("");
        const { object } = await generateObject({
            model: google("gemini-2.0-flash-001", {
                structuredOutputs: false,
            }),
            schema: feedbackSchema,
            prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.

        Transcript:
        ${formattedTranscript}

        Provide detailed feedback including:

        1. Total Score (0-100): An overall assessment of the interview performance

        2. Category Scores (0-100 each) with specific comments:
          - Communication Skills: Clarity, articulation, structured responses
          - Technical Knowledge: Understanding of key concepts for the role
          - Problem Solving: Ability to analyze problems and propose solutions
          - Cultural Fit: Alignment with company values and job role
          - Confidence and Clarity: Confidence in responses, engagement, and clarity

        3. Strengths: Identify at least 2-3 genuine strengths the candidate demonstrated

        4. Areas for Improvement: 3-5 specific areas needing development

        5. Final Assessment: A comprehensive paragraph summarizing performance

        6. Final Verdict: Select ONE of these exact verdicts based on total score:
          - "NOT_RECOMMENDED" (score < 50)
          - "DO_NOT_HIRE" (score < 60)
          - "PREFER_NOT_TO_HIRE" (score < 70)
          - "WORTH_CONSIDERING" (score < 80)
          - "RECOMMENDED" (score < 90)
          - "MUST_HIRE" (score ≥ 90)

        Guidelines:
        - Be specific with examples from the transcript
        - Balance criticism with positive observations
        - For strengths, highlight things like:
          * Clear communication in specific responses
          * Good technical examples provided
          * Positive attitude or enthusiasm
          * Strong problem-solving approaches
          * Good cultural alignment examples
        - For areas to improve, provide concrete suggestions
        - Total score should reflect the category scores
        - Never invent categories beyond those specified
        - Final verdict MUST exactly match one of the enum values provided (case-sensitive)
        `,
            system: "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories and provide a final verdict according to the scoring guidelines.",
        });
        const numericId = Number(id);
        const feedback = await prisma.feedback.create({
            data: {
                interviewId: numericId,
                userId: userId,
                totalScore: object.totalScore,
                strengths: object.strengths,
                areasForImprovement: object.areasForImprovement,
                finalAssessment: object.finalAssessment,
                finalVerdict: object.finalVerdict,
                categoryScores: {
                    create: object.categoryScores.map((category) => ({
                        name: category.name,
                        score: category.score,
                        comment: category.comment,
                    })),
                },
            },
            include: {
                categoryScores: true,
            },
        });
        await prisma.interview.update({
            where: { id: numericId },
            data: { feedbackFinalized: true },
        });
        res.status(201).json({
            success: true,
            feedback,
        });
    }
    catch (error) {
        logger.error("error in generating feedback", error);
        next(error);
    }
};
export const getFeedbackByInterviewId = async (req, res, next) => {
    const { id, source } = req.query;
    if (!id) {
        return res.status(400).json({ message: "Interview ID is required" });
    }
    if (!req.user) {
        return res
            .status(401)
            .json({ error: "Unauthorized: User not authenticated" });
    }
    const userId = Number(req.user.id || req.user.userId);
    const numericId = Number(id);
    // Create base where condition
    const whereCondition = {
        interviewId: numericId,
    };
    // Add user filter based on source
    if (source === "user") {
        whereCondition.userId = userId;
    }
    else {
        whereCondition.userId = { not: userId };
    }
    const latestFeedback = await prisma.feedback.findFirst({
        where: whereCondition,
        include: {
            categoryScores: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    if (!latestFeedback) {
        return res.status(404).json("No feedback found for this interview");
    }
    return res.status(200).json(latestFeedback);
};
