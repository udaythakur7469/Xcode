import prisma from "../configs/db.js";
import createHttpError from "http-errors";
import logger from "../configs/loggerConfig.js";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { getIO } from "../configs/socketConfig.js";
import { Difficulty } from "@prisma/client";
import {
  buildPrompt,
  hasCodeChangedSignificantly,
  hashCode,
  isLowEffort,
  normalizeCode,
} from "../services/hintsService.js";

interface CreateProblemInput {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  examples: { input: string; output: string; explanation: string }[];
  testCases: {
    userInput: string;
    apiInput: string;
    userExpectedOutput: string;
    apiExpectedOutput: string;
  }[];
  hints: string[];
}

export const getProblems = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const difficulty = req.query.difficulty as "easy" | "medium" | "hard" | undefined;
    const status = req.query.status as "solved" | "unsolved" | undefined;
    const tags = req.query.tags as string | undefined;

    // Get the authenticated user's ID if available
    const userId = req.user?.userId || req.user?.id || null;

    // Fetch the user's solved problem IDs in one query
    const solvedProblemIds = new Set<number>();
    if (userId) {
      const solvedRecords = await prisma.solvedProblems.findMany({
        where: { userId },
        select: { problemId: true },
      });
      solvedRecords.forEach((r) => solvedProblemIds.add(r.problemId));
    }

    // Build where clause — status filter now uses SolvedProblems
    // so we handle it after fetching, not in the DB query
    const whereClause: any = {};
    if (difficulty) whereClause.difficulty = difficulty;
    if (tags) {
      const tagsArray = tags.split(",");
      whereClause.tags = { hasSome: tagsArray };
    }

    // If status filter is active and user is logged in, filter by solved IDs
    if (status && userId) {
      if (status === "solved") {
        whereClause.id = { in: [...solvedProblemIds] };
      } else if (status === "unsolved") {
        whereClause.id = { notIn: [...solvedProblemIds] };
      }
    }

    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;
    if (dateFrom && dateTo && userId) {
      const parseIso = (iso: string) => {
        const [y, m, d] = iso.split("-").map(Number);
        return new Date(Date.UTC(y, m - 1, d));
      };
      const from = parseIso(dateFrom);
      const to = new Date(parseIso(dateTo).getTime() + 86_400_000); // inclusive
      whereClause.solvedProblems = {
        some: {
          userId,
          solvedAt: { gte: from, lt: to },
        },
      };
    }

    const problems = await prisma.problem.findMany({
      where: whereClause,
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        difficulty: true,
        problemStats: {
          select: {
            totalAttempts: true,
            totalSolved: true,
          },
        },
      },
    });

    const formattedProblems = problems.map((problem) => ({
      title: problem.title,
      difficulty: problem.difficulty,
      acceptanceRate:
        problem.problemStats?.totalAttempts > 0
          ? (problem.problemStats.totalSolved /
              problem.problemStats.totalAttempts) *
            100
          : 0,
      // Derive solved from SolvedProblems, not Problem.solved
      solved: solvedProblemIds.has(problem.id),
    }));

    const totalProblems = await prisma.problem.count({ where: whereClause });

    res.status(200).json({
      message: "Problems fetched successfully",
      data: formattedProblems,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProblems / limit),
        totalProblems,
      },
    });
  } catch (error) {
    logger.error("Error fetching problems:", error);
    next(error);
  }
};

export const searchProblems = async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: "Search query is required" });
  }

  try {
    const problems = await prisma.problem.findMany({
      where: {
        OR: [
          { title: { contains: query as string, mode: "insensitive" } },
          { tags: { hasSome: [query as string] } },
        ],
      },
    });

    res.status(200).json(problems);
  } catch (error) {
    logger.error("error searching problem", error);
    next(error);
  }
};

export const getProblemByTitle = async (req, res, next) => {
  const { title } = req.query; // Get problemTitle from the query parameters

  if (!title || typeof title !== "string") {
    return res
      .status(400)
      .json({ message: "Title is required as a query parameter" });
  }

  try {
    // Fetch the problem by title
    const problem = await prisma.problem.findFirst({
      where: { title },
      include: {
        examples: true,
        testCases: true,
        hints: true,
        problemStats: true,
      },
    });

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    res.status(200).json(problem); // Return the problem details
  } catch (error) {
    next(error);
  }
};

export const addHints = async (req, res, next) => {
  const { problemId, hints } = req.body;

  // Validate request body
  if (!problemId || !hints || !Array.isArray(hints)) {
    return res.status(400).json({
      success: false,
      message: "problemId and hints (as an array) are required.",
    });
  }

  // Ensure exactly 3 hints are provided
  if (hints.length !== 3) {
    return res.status(400).json({
      success: false,
      message: "Exactly 3 hints are required.",
    });
  }

  try {
    // Check if the problem exists
    const problemExists = await prisma.problem.findUnique({
      where: { id: problemId },
    });

    if (!problemExists) {
      return res.status(404).json({
        success: false,
        message: "Problem not found.",
      });
    }

    // Create hints in the database
    const createdHints = await prisma.hints.createMany({
      data: hints.map((hint) => ({
        problemId,
        hint,
      })),
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: "Hints added successfully.",
      data: createdHints,
    });
  } catch (error) {
    next(error);
  }
};

export const addEditorials = async (req, res, next) => {
  try {
    const {
      problemId,
      videoUrl,

      bruteForceTitle,
      bruteForceIntuition,
      bruteForceAlgorithm,
      bruteForceCodeCpp,
      bruteForceCodeJs,
      bruteForceCodePython,
      bruteForceCodeJava,
      bruteForceTimeComplexity,
      bruteForceSpaceComplexity,

      betterTitle,
      betterIntuition,
      betterAlgorithm,
      betterCodeCpp,
      betterCodeJs,
      betterCodePython,
      betterCodeJava,
      betterTimeComplexity,
      betterSpaceComplexity,

      optimalTitle,
      optimalIntuition,
      optimalAlgorithm,
      optimalCodeCpp,
      optimalCodeJs,
      optimalCodePython,
      optimalCodeJava,
      optimalTimeComplexity,
      optimalSpaceComplexity,
    } = req.body;

    const editorial = await prisma.editorial.create({
      data: {
        problem: {
          connect: { id: Number(problemId) },
        },
        videoUrl,

        bruteForceTitle,
        bruteForceIntuition,
        bruteForceAlgorithm,
        bruteForceCodeCpp,
        bruteForceCodeJs,
        bruteForceCodePython,
        bruteForceCodeJava,
        bruteForceTimeComplexity,
        bruteForceSpaceComplexity,

        betterTitle,
        betterIntuition,
        betterAlgorithm,
        betterCodeCpp,
        betterCodeJs,
        betterCodePython,
        betterCodeJava,
        betterTimeComplexity,
        betterSpaceComplexity,

        optimalTitle,
        optimalIntuition,
        optimalAlgorithm,
        optimalCodeCpp,
        optimalCodeJs,
        optimalCodePython,
        optimalCodeJava,
        optimalTimeComplexity,
        optimalSpaceComplexity,
      },
    });

    res.status(201).json(editorial);
  } catch (error) {
    console.error("Error adding editorial:", error);
    next(error);
  }
};

export const getEditorialByProblemTitle = async (req, res, next) => {
  const { title } = req.query; // Get the title from the query parameters

  // Validate the title
  if (!title || typeof title !== "string") {
    return res
      .status(400)
      .json({ message: "Title is required as a query parameter" });
  }

  try {
    // Step 1: Find the problem by title to get its ID and title
    const problem = await prisma.problem.findFirst({
      where: { title },
      select: { id: true, title: true }, // Fetch both ID and title
    });

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Step 2: Fetch the editorial data using the problem ID
    const editorial = await prisma.editorial.findUnique({
      where: { problemId: problem.id },
    });

    if (!editorial) {
      return res
        .status(404)
        .json({ message: "Editorial not found for this problem" });
    }

    // Step 3: Return the editorial data along with the problem title
    res.status(200).json({
      ...editorial,
      problemTitle: problem.title,
    });
  } catch (error) {
    logger.error("Error fetching editorial by problem title:", error);
    next(error);
  }
};

export const problemReaction = async (req, res, next) => {
  const { title } = req.query;
  const { action } = req.body;
  const userId = req.user.id || req.user.userId;

  if (!title || typeof title !== "string") {
    return res
      .status(400)
      .json({ message: "Title is required as a query parameter" });
  }
  if (!action || (action !== "like" && action !== "dislike")) {
    return res
      .status(400)
      .json({ message: "Action must be either 'like' or 'dislike'" });
  }
  if (!userId) {
    return res
      .status(401)
      .json({ message: "User ID not found in token payload" });
  }

  try {
    const problem = await prisma.problem.findFirst({
      where: { title },
      select: { id: true, title: true },
    });

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const [currentLikes, currentDislikes] = await prisma.$transaction([
      prisma.userProblemReactions.count({
        where: { problemId: problem.id, reactionType: "like" },
      }),
      prisma.userProblemReactions.count({
        where: { problemId: problem.id, reactionType: "dislike" },
      }),
    ]);

    const existingReaction = await prisma.userProblemReactions.findUnique({
      where: { userId_problemId: { userId, problemId: problem.id } },
    });

    let responsePayload: {
      message: string;
      likes: number;
      dislikes: number;
    };

    if (!existingReaction) {
      await prisma.userProblemReactions.create({
        data: { userId, problemId: problem.id, reactionType: action },
      });
      responsePayload = {
        message: `${action === "like" ? "Like" : "Dislike"} added successfully`,
        likes: action === "like" ? currentLikes + 1 : currentLikes,
        dislikes: action === "dislike" ? currentDislikes + 1 : currentDislikes,
      };
    } else if (existingReaction.reactionType === action) {
      await prisma.userProblemReactions.delete({
        where: { userId_problemId: { userId, problemId: problem.id } },
      });
      responsePayload = {
        message: `${action === "like" ? "Like" : "Dislike"} removed successfully`,
        likes: action === "like" ? currentLikes - 1 : currentLikes,
        dislikes: action === "dislike" ? currentDislikes - 1 : currentDislikes,
      };
    } else {
      await prisma.userProblemReactions.update({
        where: { userId_problemId: { userId, problemId: problem.id } },
        data: { reactionType: action },
      });
      const newLikes =
        existingReaction.reactionType === "like"
          ? currentLikes - 1
          : currentLikes + 1;
      const newDislikes =
        existingReaction.reactionType === "dislike"
          ? currentDislikes - 1
          : currentDislikes + 1;
      responsePayload = {
        message: `Changed from ${existingReaction.reactionType} to ${action}`,
        likes: newLikes,
        dislikes: newDislikes,
      };
    }

    // ── Emit real-time update to all OTHER clients in this problem's room ─
    // `to(room)` excludes the sender — their UI is already updated
    // by the optimistic update in the frontend store.
    try {
      getIO().to(`problem:${problem.id}`).emit("problem:reaction:updated", {
        problemId: problem.id,
        likes: responsePayload.likes,
        dislikes: responsePayload.dislikes,
      });
    } catch (socketErr) {
      logger.warn("Socket emit failed for problem reaction:", socketErr);
    }

    try {
      if (req.cache) {
        await req.cache.invalidateByTags([
          `problem:reactions:${problem.title || title}`,
        ]);
      }
    } catch (cacheErr) {
      logger.error("Cache invalidation error in problemReaction", cacheErr);
    }
    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Problem reaction error:", error);
    return res
      .status(500)
      .json({ message: "Server error processing reaction" });
  }
};

export const getProblemReactions = async (req, res, next) => {
  const { title } = req.query;

  // Extract user ID from the JWT payload that was attached by the authMiddleware
  const userId = req.user?.id || req.user?.userId;

  if (!title || typeof title !== "string") {
    return res
      .status(400)
      .json({ message: "Title is required as a query parameter" });
  }
  try {
    // Find the problem by title
    const problem = await prisma.problem.findFirst({
      where: { title },
      select: { id: true },
    });
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }
    // Get current likes and dislikes counts
    const [likes, dislikes] = await prisma.$transaction([
      prisma.userProblemReactions.count({
        where: {
          problemId: problem.id,
          reactionType: "like",
        },
      }),
      prisma.userProblemReactions.count({
        where: {
          problemId: problem.id,
          reactionType: "dislike",
        },
      }),
    ]);
    // Get user's current reaction if authenticated
    let userReaction = null;
    if (userId) {
      const reaction = await prisma.userProblemReactions.findUnique({
        where: {
          userId_problemId: {
            userId: userId,
            problemId: problem.id,
          },
        },
        select: {
          reactionType: true,
        },
      });

      if (reaction) {
        userReaction = reaction.reactionType;
      }
    }
    return res.status(200).json({
      likes,
      dislikes,
      userReaction,
    });
  } catch (error) {
    console.error("Error fetching problem reactions:", error);
    return res.status(500).json({
      message: "Server error while fetching reactions",
    });
  }
};

export const addTestCases = async (req, res, next) => {
  try {
    const {
      problemId,
      userInput,
      apiInput,
      userExpectedOutput,
      apiExpectedOutput,
    } = req.body;

    // Validate required fields
    if (
      !problemId ||
      !userInput ||
      !apiInput ||
      !userExpectedOutput ||
      !apiExpectedOutput
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if the referenced problem exists
    const problemExists = await prisma.problem.findUnique({
      where: { id: problemId },
    });

    if (!problemExists) {
      return res.status(404).json({
        success: false,
        message: `Problem with id ${problemId} not found`,
      });
    }

    // Create the test case
    const testCase = await prisma.testCases.create({
      data: {
        problemId,
        userInput,
        apiInput,
        userExpectedOutput,
        apiExpectedOutput,
      },
    });

    return res.status(201).json({
      success: true,
      data: testCase,
      message: "Test case created successfully",
    });
  } catch (error) {
    console.error("Error adding test case:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add test case",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getTestCases = async (req, res, next) => {
  const { title } = req.query;

  if (!title || typeof title !== "string") {
    throw createHttpError.BadRequest("title is required");
  }

  try {
    const problem = await prisma.problem.findFirst({
      where: {
        title: title,
      },
      select: { id: true },
    });

    if (!problem) {
      throw createHttpError.NotFound(
        "unable to find problem for the requested problem title",
      );
    }

    const testCases = await prisma.testCases.findMany({
      where: { problemId: problem.id },
      select: { id: true, userExpectedOutput: true, userInput: true },
    });

    if (!testCases || testCases.length == 0) {
      throw createHttpError.BadRequest("unable to find testCases");
    }

    return res.status(201).json({
      message: "Test cases fetched successfully",
      testCases,
      count: testCases.length,
    });
  } catch (error) {
    logger.error("Error fetching editorial by problem title:", error);
    next(error);
  }
};

export const generateHints = async (req: any, res: any, next: any) => {
  const { problemTitle, problemDescription, userCode, language } = req.body;
  const userId: number = req.user.userId;

  // ── Input validation ───────────────────────────────────────────────────────

  if (!problemTitle || !problemDescription || !language) {
    return res
      .status(400)
      .json({
        message: "problemTitle, problemDescription, and language are required.",
      });
  }

  const code = (userCode ?? "").trim();

  try {
    // ── Resolve problemId ──────────────────────────────────────────────────

    const problem = await prisma.problem.findFirst({
      where: { title: problemTitle },
      select: { id: true },
    });

    if (!problem) {
      return res.status(404).json({ message: "Problem not found." });
    }

    const problemId = problem.id;

    // ── Normalize + hash ───────────────────────────────────────────────────

    const normalized = normalizeCode(code);
    const currentHash = hashCode(normalized);
    const lowEffort = isLowEffort(normalized);

    // ── Check existing cache row ───────────────────────────────────────────

    const cached = await prisma.aiHintCache.findUnique({
      where: {
        userId_problemId_language: { userId, problemId, language },
      },
    });

    // ── Serve cache if code has not changed significantly ──────────────────

    if (
      cached &&
      !hasCodeChangedSignificantly(cached.normalizedCodeHash, currentHash)
    ) {
      return res.status(200).json({
        hints: cached.hints,
        unlockedLevel: cached.unlockedLevel,
      });
    }

    // ── Generate fresh hints via Gemini ────────────────────────────────────

    const prompt = buildPrompt(
      problemTitle,
      problemDescription,
      code,
      language,
      lowEffort,
    );

    let parsedHints: string[];

    try {
      const { text } = await generateText({
        model: google("gemini-2.5-flash"),
        prompt,
      });

      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      if (
        !parsed.hints ||
        !Array.isArray(parsed.hints) ||
        parsed.hints.length !== 3 ||
        parsed.hints.some((h: any) => typeof h !== "string")
      ) {
        throw new Error("Malformed hints shape from AI");
      }

      parsedHints = parsed.hints;
    } catch (aiError) {
      logger.error("AI hint generation failed", aiError);
      return res
        .status(503)
        .json({
          message:
            "Hints are temporarily unavailable. Please try again shortly.",
        });
    }

    // ── Upsert cache row ───────────────────────────────────────────────────
    // Language change or first generation → reset unlockedLevel to 1.
    // Significant code change on same language → also reset to 1
    // so the user re-reads from the beginning with fresh hints.

    const upserted = await prisma.aiHintCache.upsert({
      where: {
        userId_problemId_language: { userId, problemId, language },
      },
      update: {
        normalizedCodeHash: currentHash,
        codeSnapshot: code,
        hints: parsedHints,
        unlockedLevel: 1,
      },
      create: {
        userId,
        problemId,
        language,
        normalizedCodeHash: currentHash,
        codeSnapshot: code,
        hints: parsedHints,
        unlockedLevel: 1,
      },
    });

    return res.status(200).json({
      hints: upserted.hints,
      unlockedLevel: upserted.unlockedLevel,
    });
  } catch (error) {
    logger.error("Error in generateHints", error);
    next(error);
  }
};

export const updateHintUnlock = async (req: any, res: any, next: any) => {
  const { problemTitle, language, unlockedLevel } = req.body;
  const userId: number = req.user.userId;

  if (!problemTitle || !language || typeof unlockedLevel !== "number") {
    return res
      .status(400)
      .json({
        message: "problemTitle, language, and unlockedLevel are required.",
      });
  }

  if (unlockedLevel < 1 || unlockedLevel > 3) {
    return res
      .status(400)
      .json({ message: "unlockedLevel must be between 1 and 3." });
  }

  try {
    const problem = await prisma.problem.findFirst({
      where: { title: problemTitle },
      select: { id: true },
    });

    if (!problem) {
      return res.status(404).json({ message: "Problem not found." });
    }

    // Only update if the new level is higher — never regress
    await prisma.aiHintCache.updateMany({
      where: {
        userId,
        problemId: problem.id,
        language,
        unlockedLevel: { lt: unlockedLevel },
      },
      data: { unlockedLevel },
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    logger.error("Error in updateHintUnlock", error);
    next(error);
  }
};

interface EditorialInput {
  videoUrl?: string;

  bruteForceTitle: string;
  bruteForceIntuition: string;
  bruteForceAlgorithm: string;
  bruteForceCodeCpp: string;
  bruteForceCodeJs: string;
  bruteForceCodePython: string;
  bruteForceCodeJava: string;
  bruteForceTimeComplexity: string;
  bruteForceSpaceComplexity: string;

  betterTitle: string;
  betterIntuition: string;
  betterAlgorithm: string;
  betterCodeCpp: string;
  betterCodeJs: string;
  betterCodePython: string;
  betterCodeJava: string;
  betterTimeComplexity: string;
  betterSpaceComplexity: string;

  optimalTitle: string;
  optimalIntuition: string;
  optimalAlgorithm: string;
  optimalCodeCpp: string;
  optimalCodeJs: string;
  optimalCodePython: string;
  optimalCodeJava: string;
  optimalTimeComplexity: string;
  optimalSpaceComplexity: string;
}

interface BaseCodeInput {
  language: string; 
  baseClassCode?: string; 
  headerFiles?: string; 
  mainClassCode?: string;
}

interface ExampleInput {
  input: string;
  output: string;
  explanation: string;
}

interface TestCaseInput {
  userInput: string;
  apiInput: string;
  userExpectedOutput: string;
  apiExpectedOutput: string;
}

interface CreateProblemInput {
  title: string;
  description: string;
  difficulty: Difficulty;
  tags: string[];
  constraints: string[];
  examples: ExampleInput[];
  testCases: TestCaseInput[];
  hints: string[];
  baseCodes: BaseCodeInput[];
  editorial: EditorialInput;
}

export const createProblem = async (req, res, next) => {
  try {
    const {
      title,
      description,
      difficulty,
      tags,
      constraints,
      examples,
      testCases,
      hints,
      baseCodes,
      editorial,
    }: CreateProblemInput = req.body;

    // ── Presence checks ───────────────────────────────────────────
    if (
      !title ||
      !description ||
      !difficulty ||
      !tags ||
      !constraints ||
      !examples ||
      !testCases ||
      !hints ||
      !baseCodes ||
      !editorial
    ) {
      throw createHttpError.BadRequest("Please fill all fields");
    }

    // ── Array length checks ───────────────────────────────────────
    if (
      constraints.length === 0 ||
      examples.length === 0 ||
      testCases.length === 0 ||
      hints.length === 0 ||
      baseCodes.length === 0
    ) {
      throw createHttpError.BadRequest(
        "examples, testCases, hints, and baseCodes cannot be empty",
      );
    }

    // ── Editorial completeness check ──────────────────────────────
    const requiredEditorialFields: (keyof EditorialInput)[] = [
      "bruteForceTitle",
      "bruteForceIntuition",
      "bruteForceAlgorithm",
      "bruteForceCodeCpp",
      "bruteForceCodeJs",
      "bruteForceCodePython",
      "bruteForceCodeJava",
      "bruteForceTimeComplexity",
      "bruteForceSpaceComplexity",
      "betterTitle",
      "betterIntuition",
      "betterAlgorithm",
      "betterCodeCpp",
      "betterCodeJs",
      "betterCodePython",
      "betterCodeJava",
      "betterTimeComplexity",
      "betterSpaceComplexity",
      "optimalTitle",
      "optimalIntuition",
      "optimalAlgorithm",
      "optimalCodeCpp",
      "optimalCodeJs",
      "optimalCodePython",
      "optimalCodeJava",
      "optimalTimeComplexity",
      "optimalSpaceComplexity",
    ];

    const missingEditorialFields = requiredEditorialFields.filter(
      (field) => !editorial[field],
    );

    if (missingEditorialFields.length > 0) {
      throw createHttpError.BadRequest(
        `Missing editorial fields: ${missingEditorialFields.join(", ")}`,
      );
    }

    // ── Create the problem with all relations ─────────────────────
    const newProblem = await prisma.problem.create({
      data: {
        title,
        description,
        difficulty,
        tags,
        constraints,

        examples: {
          create: examples,
        },

        testCases: {
          create: testCases,
        },

        hints: {
          create: hints.map((hint) => ({ hint })),
        },

        baseCodes: {
          create: baseCodes.map(
            ({ language, baseClassCode, headerFiles, mainClassCode }) => ({
              language,
              baseClassCode: baseClassCode ?? null,
              headerFiles: headerFiles ?? null,
              mainClassCode: mainClassCode ?? null,
            }),
          ),
        },

        editorial: {
          create: {
            videoUrl: editorial.videoUrl,

            bruteForceTitle: editorial.bruteForceTitle,
            bruteForceIntuition: editorial.bruteForceIntuition,
            bruteForceAlgorithm: editorial.bruteForceAlgorithm,
            bruteForceCodeCpp: editorial.bruteForceCodeCpp,
            bruteForceCodeJs: editorial.bruteForceCodeJs,
            bruteForceCodePython: editorial.bruteForceCodePython,
            bruteForceCodeJava: editorial.bruteForceCodeJava,
            bruteForceTimeComplexity: editorial.bruteForceTimeComplexity,
            bruteForceSpaceComplexity: editorial.bruteForceSpaceComplexity,

            betterTitle: editorial.betterTitle,
            betterIntuition: editorial.betterIntuition,
            betterAlgorithm: editorial.betterAlgorithm,
            betterCodeCpp: editorial.betterCodeCpp,
            betterCodeJs: editorial.betterCodeJs,
            betterCodePython: editorial.betterCodePython,
            betterCodeJava: editorial.betterCodeJava,
            betterTimeComplexity: editorial.betterTimeComplexity,
            betterSpaceComplexity: editorial.betterSpaceComplexity,

            optimalTitle: editorial.optimalTitle,
            optimalIntuition: editorial.optimalIntuition,
            optimalAlgorithm: editorial.optimalAlgorithm,
            optimalCodeCpp: editorial.optimalCodeCpp,
            optimalCodeJs: editorial.optimalCodeJs,
            optimalCodePython: editorial.optimalCodePython,
            optimalCodeJava: editorial.optimalCodeJava,
            optimalTimeComplexity: editorial.optimalTimeComplexity,
            optimalSpaceComplexity: editorial.optimalSpaceComplexity,
          },
        },
      },

      include: {
        examples: true,
        testCases: true,
        hints: true,
        baseCodes: true,
        editorial: true,
      },
    });

    try {
      if (req.cache) {
        await req.cache.invalidateByTags(["problems:list", "problems:search"]);
      }
    } catch (cacheErr) {
      logger.error("Cache invalidation error in createProblem", cacheErr);
    }

    res.status(201).json({
      message: "Problem created successfully",
      problem: newProblem,
    });
  } catch (error) {
    logger.error("Error in creating problem", error);
    next(error);
  }
};
