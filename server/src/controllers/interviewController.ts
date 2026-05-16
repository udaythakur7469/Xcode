import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";
import logger from "../configs/loggerConfig.js";
import createHttpError from "http-errors";
import prisma from "../configs/db.js";
import { feedbackSchema } from "../utils/feedbackUtil.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: compute candidate talk ratio from transcript
// ─────────────────────────────────────────────────────────────────────────────

function computeTalkRatio(
  transcript: { role: string; content: string }[],
): number {
  let candidateWords = 0;
  let totalWords = 0;
  for (const msg of transcript) {
    const words = msg.content.trim().split(/\s+/).length;
    totalWords += words;
    if (msg.role === "user") candidateWords += words;
  }
  if (totalWords === 0) return 50;
  return Math.round((candidateWords / totalWords) * 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// generateInterview
// ─────────────────────────────────────────────────────────────────────────────

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
        userId,
        role,
        type: type.toUpperCase(),
        amount,
        techStack: techstack.split(",").map((t: string) => t.trim()),
        level,
        questions: JSON.parse(questions),
        finalized: true,
      },
    });

    return res.json(interview);
  } catch (error) {
    logger.error("error in generating interview", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getInterviewsByUserId
// ─────────────────────────────────────────────────────────────────────────────

export const getInterviewsByUserId = async (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not authenticated" });
  }
  const userId = req.user.id || req.user.userId;

  try {
    const interviews = await prisma.interview.findMany({
      where: { userId },
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
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(interviews);
  } catch (error) {
    logger.error("error in generating interview", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getLatestInterviews
// ─────────────────────────────────────────────────────────────────────────────

export const getLatestInterviews = async (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not authenticated" });
  }
  const userId = req.user.id || req.user.userId;

  try {
    const interviews = await prisma.interview.findMany({
      where: { userId: { not: userId } },
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
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(interviews);
  } catch (error) {
    logger.error("error in generating interview", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getInterviewDetails
// ─────────────────────────────────────────────────────────────────────────────

export const getInterviewDetails = async (req, res, next) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ message: "Interview ID is required" });
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

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
  } catch (error) {
    logger.error("error in getting interview details", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// generateFeedback  (UPDATED — expanded Gemini prompt for all 6 features)
// ─────────────────────────────────────────────────────────────────────────────

export const generateFeedback = async (req, res, next) => {
  const { id, transcript } = req.body;

  if (!id) return res.status(400).json({ message: "Interview ID is required" });
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const userId = Number(req.user.id || req.user.userId);

  try {
    // Compute talk ratio from raw transcript before stringifying
    const candidateTalkRatio = computeTalkRatio(transcript);

    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`,
      )
      .join("");

    // Fetch the interview so we know total question count
    const interview = await prisma.interview.findUnique({
      where: { id: Number(id) },
      select: { questions: true },
    });

    const questionCount =
      interview?.questions?.length ??
      transcript.filter((m: { role: string }) => m.role === "assistant").length;

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", { structuredOutputs: false }),
      schema: feedbackSchema,
      prompt: `
You are an AI interviewer analyzing a mock interview. Evaluate the candidate thoroughly and honestly across every dimension below. Do not be lenient — surface genuine weaknesses.

Transcript:
${formattedTranscript}

---

PROVIDE ALL OF THE FOLLOWING:

1. TOTAL SCORE (0–100)
   Overall performance assessment.

2. CATEGORY SCORES (0–100 each) with detailed comments:
   - Communication Skills
   - Technical Knowledge
   - Problem Solving
   - Cultural Fit
   - Confidence and Clarity

3. STRENGTHS — at least 2–3 genuine strengths demonstrated.

4. AREAS FOR IMPROVEMENT — 3–5 specific, concrete areas.

5. FINAL ASSESSMENT — one comprehensive paragraph summarising performance.

6. FINAL VERDICT — select exactly one (case-sensitive):
   "NOT_RECOMMENDED" (score < 50)
   "DO_NOT_HIRE"      (score < 60)
   "PREFER_NOT_TO_HIRE" (score < 70)
   "WORTH_CONSIDERING"  (score < 80)
   "RECOMMENDED"        (score < 90)
   "MUST_HIRE"          (score ≥ 90)

7. CANDIDATE TALK RATIO
   Already computed externally: ${candidateTalkRatio}
   Return this exact value as candidateTalkRatio.

8. QUESTION SCORES — for each of the ${questionCount} questions in the transcript:
   - questionNumber (1-indexed)
   - questionText (the AI's question, verbatim or closely paraphrased)
   - score (0–100) evaluating the quality of the candidate's answer
   - comment (1–2 sentences explaining the score, specific to that answer)

9. KEY MOMENTS — identify exactly 3 moments:
   a) BEST — the single strongest answer the candidate gave
   b) WEAKEST — the single poorest answer
   c) NOTABLE — one other moment worth highlighting (positive or negative)
   
   For each provide:
   - type: "BEST" | "WEAKEST" | "NOTABLE"
   - questionNumber
   - questionText
   - quote: a verbatim or near-verbatim excerpt from the candidate's answer (2–4 sentences max)
   - annotation: your assessment of why this moment matters (1–2 sentences)
   - timestampLabel: rough position in the interview (e.g. "~3 min in", "~22 min in")

10. RECOMMENDED TOPICS — 3–4 study topics ranked by urgency:
    For each provide:
    - topic: concise topic name
    - reason: why this topic is recommended, referencing specific question numbers and scores
    - priority: "CRITICAL" | "IMPORTANT" | "RECOMMENDED"
    - tags: 3–5 specific sub-topics as short strings

---

GUIDELINES:
- Be specific — reference actual transcript content in every field where possible
- question scores must be consistent with category scores and total score
- Key moment quotes must come directly from the transcript
- Recommended topics must directly address the lowest-scoring questions
- finalVerdict MUST exactly match one of the enum values (case-sensitive)
`,
      system:
        "You are a professional interviewer analyzing a mock interview. Evaluate objectively, surfacing both strengths and genuine weaknesses with specific evidence from the transcript.",
    });

    const numericId = Number(id);

    const feedback = await prisma.feedback.create({
      data: {
        interviewId: numericId,
        userId,
        totalScore: object.totalScore,
        strengths: object.strengths,
        areasForImprovement: object.areasForImprovement,
        finalAssessment: object.finalAssessment,
        finalVerdict: object.finalVerdict,
        candidateTalkRatio: object.candidateTalkRatio,
        categoryScores: {
          create: object.categoryScores.map((c: any) => ({
            name: c.name,
            score: c.score,
            comment: c.comment,
          })),
        },
        questionScores: {
          create: object.questionScores.map((q: any) => ({
            questionNumber: q.questionNumber,
            questionText: q.questionText,
            score: q.score,
            comment: q.comment,
          })),
        },
        keyMoments: {
          create: object.keyMoments.map((m: any) => ({
            type: m.type,
            questionNumber: m.questionNumber,
            questionText: m.questionText,
            quote: m.quote,
            annotation: m.annotation,
            timestampLabel: m.timestampLabel,
          })),
        },
        recommendedTopics: {
          create: object.recommendedTopics.map((t: any) => ({
            topic: t.topic,
            reason: t.reason,
            priority: t.priority,
            tags: t.tags,
          })),
        },
      },
      include: {
        categoryScores: true,
        questionScores: { orderBy: { questionNumber: "asc" } },
        keyMoments: true,
        recommendedTopics: true,
      },
    });

    await prisma.interview.update({
      where: { id: numericId },
      data: { feedbackFinalized: true },
    });

    res.status(201).json({ success: true, feedback });
  } catch (error) {
    logger.error("error in generating feedback", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getFeedbackByInterviewId  (UPDATED — includes all new relations)
// ─────────────────────────────────────────────────────────────────────────────

export const getFeedbackByInterviewId = async (req, res, next) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ message: "Interview ID is required" });
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const numericId = Number(id);

  try {
    const latestFeedback = await prisma.feedback.findFirst({
      where: { interviewId: numericId },
      include: {
        categoryScores: true,
        questionScores: { orderBy: { questionNumber: "asc" } },
        keyMoments: true,
        recommendedTopics: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestFeedback) {
      return res.status(404).json("No feedback found for this interview");
    }

    return res.status(200).json(latestFeedback);
  } catch (error) {
    logger.error("error in getting feedback", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getFeedbackHistory  (NEW — Option A: score history for charts)
// Returns all feedback for interviews of the same role+type for the logged-in user
// ─────────────────────────────────────────────────────────────────────────────

export const getFeedbackHistory = async (req, res, next) => {
  const { interviewId } = req.query;
  if (!interviewId)
    return res.status(400).json({ message: "Interview ID is required" });
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const userId = Number(req.user.id || req.user.userId);
  const numericId = Number(interviewId);

  try {
    // Get the role + type of the current interview to scope history
    const currentInterview = await prisma.interview.findUnique({
      where: { id: numericId },
      select: { role: true, type: true },
    });

    if (!currentInterview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    // Fetch all feedbacks for this user, same role+type, ordered ascending (for chart)
    const history = await prisma.feedback.findMany({
      where: {
        userId,
        interview: {
          role: currentInterview.role,
          type: currentInterview.type,
        },
      },
      select: {
        id: true,
        totalScore: true,
        finalVerdict: true,
        createdAt: true,
        interviewId: true,
        categoryScores: {
          select: { name: true, score: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Also compute platform average for the same interview type
    const platformAvg = await prisma.feedback.aggregate({
      where: {
        interview: { type: currentInterview.type },
      },
      _avg: { totalScore: true },
    });

    // Compute user's personal average (for the "+N vs your average" stat)
    const userAvg = await prisma.feedback.aggregate({
      where: {
        userId,
        interview: { type: currentInterview.type },
      },
      _avg: { totalScore: true },
    });

    // Percentile: count how many users scored below current feedback's score
    const currentFeedback = history.find((f) => f.interviewId === numericId);
    let percentile = 0;
    if (currentFeedback) {
      const below = await prisma.feedback.count({
        where: {
          interview: { type: currentInterview.type },
          totalScore: { lt: currentFeedback.totalScore },
        },
      });
      const total = await prisma.feedback.count({
        where: { interview: { type: currentInterview.type } },
      });
      percentile = total > 0 ? Math.round((below / total) * 100) : 0;
    }

    return res.status(200).json({
      history,
      platformAvg: Math.round(platformAvg._avg.totalScore ?? 0),
      userAvg: Math.round(userAvg._avg.totalScore ?? 0),
      percentile,
    });
  } catch (error) {
    logger.error("error in getting feedback history", error);
    next(error);
  }
};
