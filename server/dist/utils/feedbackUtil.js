import { z } from "zod";
const categoryScoreSchema = z.object({
    name: z.string(),
    score: z.number().min(0).max(100),
    comment: z.string(),
});
const questionScoreSchema = z.object({
    questionNumber: z.number().int().min(1),
    questionText: z.string(),
    score: z.number().min(0).max(100),
    comment: z.string(),
});
const keyMomentSchema = z.object({
    type: z.enum(["BEST", "WEAKEST", "NOTABLE"]),
    questionNumber: z.number().int().min(1),
    questionText: z.string(),
    quote: z.string(),
    annotation: z.string(),
    timestampLabel: z.string(), // e.g. "~3 min in"
});
const recommendedTopicSchema = z.object({
    topic: z.string(),
    reason: z.string(),
    priority: z.enum(["CRITICAL", "IMPORTANT", "RECOMMENDED"]),
    tags: z.array(z.string()),
});
export const feedbackSchema = z.object({
    totalScore: z.number().min(0).max(100),
    categoryScores: z.array(categoryScoreSchema),
    strengths: z.array(z.string()),
    areasForImprovement: z.array(z.string()),
    finalAssessment: z.string(),
    finalVerdict: z.enum([
        "NOT_RECOMMENDED",
        "DO_NOT_HIRE",
        "PREFER_NOT_TO_HIRE",
        "WORTH_CONSIDERING",
        "RECOMMENDED",
        "MUST_HIRE",
    ]),
    candidateTalkRatio: z.number().min(0).max(100),
    questionScores: z.array(questionScoreSchema),
    keyMoments: z.array(keyMomentSchema).length(3),
    recommendedTopics: z.array(recommendedTopicSchema).min(3).max(4),
});
