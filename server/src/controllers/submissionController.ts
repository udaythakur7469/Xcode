import axios from "axios";
import prisma from "../configs/db.js";
import {
  getLanguageId,
  parseErrorPosition,
  pollJudge0Result,
  processCompilationError,
} from "../services/submissionService.js";
import { Difficulty, SubmissionStatus } from "@prisma/client";
import logger from "../configs/loggerConfig.js";
import createHttpError from "http-errors";

export const JUDGE0_URL = process.env.JUDGE0_URL;
export const JUDGE0_HEADERS = {
  "x-rapidapi-key": process.env.JUDGE0_API_KEY,
  "x-rapidapi-host": process.env.JUDGE0_HOST,
  "Content-Type": "application/json",
};

export const storeBaseClassCode = async (req, res) => {
  const { problemId, language, baseClassCode, headerFiles, mainClassCode } =
    req.body;

  try {
    // Check if the problem exists
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    // Check if a base class code already exists for this problem and language
    const existingCode = await prisma.baseCode.findUnique({
      where: { problemId_language: { problemId, language } },
    });

    if (existingCode) {
      return res.status(400).json({
        error: "Base class code for this problem and language already exists",
      });
    }

    // Create a new entry for the base class code
    const newBaseClassCode = await prisma.baseCode.create({
      data: {
        problemId,
        language,
        baseClassCode,
        headerFiles,
        mainClassCode,
      },
    });

    res.status(201).json(newBaseClassCode);
  } catch (error) {
    console.error("Error storing base class code:", error);
    res.status(500).json({ error: "Failed to store base class code" });
  }
};

export const fetchBaseClassCode = async (req, res) => {
  const { problemId, language } = req.query;

  try {
    // Fetch the base class code for the specified problem and language
    const baseClassCode = await prisma.baseCode.findUnique({
      where: {
        problemId_language: { problemId: parseInt(problemId), language },
      },
    });

    if (!baseClassCode) {
      return res.status(404).json({
        error: "Base class code not found for this problem and language",
      });
    }

    // Return the base class code, header files, and main class code
    res.status(200).json({
      baseClassCode: baseClassCode.baseClassCode,
    });
  } catch (error) {
    console.error("Error fetching base class code:", error);
    res.status(500).json({ error: "Failed to fetch base class code" });
  }
};

export const runCode = async (req, res, next) => {
  // Check if the user is authenticated
  if (!req.user) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not authenticated" });
  }

  const { language, code } = req.body;
  const { title } = req.query; // Get problemTitle from the query parameters

  if (!title || typeof title !== "string") {
    return res
      .status(400)
      .json({ message: "Title is required as a query parameter" });
  }

  try {
    // Fetch the problem details, including test cases and base code
    const problemData = await prisma.problem.findFirst({
      where: { title },
      include: {
        testCases: true,
        baseCodes: true,
      },
    });

    if (!problemData) {
      return res.status(404).json({ error: "Problem not found" });
    }

    // Fetch the base code for the selected language
    const baseCode = problemData.baseCodes.find(
      (baseCode) => baseCode.language === language
    );

    if (!baseCode) {
      return res
        .status(404)
        .json({ error: "Base code not found for this language" });
    }

    // Add a newline after every line in the user's code

    // Combine the header files, formatted user's code, and main class code
    const fullCode = `${baseCode.headerFiles || ""}\n${code}\n${
      baseCode.mainClassCode || ""
    }`;

    console.log("Full code being sent:", fullCode); // For debugging

    // Send the code to Judge0 API
    const judge0Response = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`,
      {
        source_code: Buffer.from(fullCode).toString("base64"), // Encode the source code
        language_id: getLanguageId(language), // Map language to Judge0 language ID
        stdin: Buffer.from(problemData.testCases[0].apiInput).toString(
          "base64"
        ), // Encode the input
      },
      {
        headers: JUDGE0_HEADERS,
      }
    );

    // Poll Judge0 API for the result
    const submissionId = judge0Response.data.token;

    const result = judge0Response.data;
    console.log("Judge0 response:", JSON.stringify(judge0Response.data));

    // Decode response data
    if (result.stdout) {
      result.stdout = Buffer.from(result.stdout, "base64").toString();
    }
    if (result.stderr) {
      result.stderr = Buffer.from(result.stderr, "base64").toString();
    }
    if (result.compile_output) {
      result.compile_output = Buffer.from(
        result.compile_output,
        "base64"
      ).toString();
    }

    const errorInfo = parseErrorPosition(result.compile_output, language);

    // Check if the code ran successfully
    if (result.status.id !== 3) {
      // Code failed to run - use the helper function
      const errorResponse = processCompilationError(result, errorInfo);
      return res.status(400).json(errorResponse);
    }

    // Return the result of the first test case
    res.status(200).json({
      message: "Code executed successfully",
      stdout: result.stdout,
      time: result.time,
      memory: result.memory,
      testCase: {
        input: Buffer.from(problemData.testCases[0].userInput).toString(), // Original input without base64 encoding
        userOutput: problemData.testCases[0].userExpectedOutput || null,
      },
    });
  } catch (error) {
    console.error("Error running code:", error);
    res.status(500).json({ error: "Failed to run code" });
  }
};

export const submitCode = async (req, res) => {
  // Check if the user is authenticated
  if (!req.user) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not authenticated" });
  }

  const { language, code } = req.body;
  const { title } = req.query; // Get problemTitle from the query parameters

  if (!title || typeof title !== "string") {
    return res
      .status(400)
      .json({ message: "Title is required as a query parameter" });
  }

  try {
    // Fetch the problem details, including test cases and base code
    const problemData = await prisma.problem.findFirst({
      where: { title },
      include: {
        testCases: true,
        baseCodes: true,
      },
    });

    console.log("problem", problemData);

    if (!problemData) {
      return res.status(404).json({ error: "Problem not found" });
    }

    // Fetch the base code for the selected language
    const baseCode = problemData.baseCodes.find(
      (baseCode) => baseCode.language === language
    );

    if (!baseCode) {
      return res
        .status(404)
        .json({ error: "Base code not found for this language" });
    }

    // Combine the header files, formatted user's code, and main class code
    const fullCode = `${baseCode.headerFiles || ""}\n${code}\n${
      baseCode.mainClassCode || ""
    }`;

    console.log("Full code being sent:", fullCode); // For debugging

    // Validate the code against all test cases
    let allTestCasesPassed = true;
    let failedTestCase = null;
    let totalTestCases = problemData.testCases.length;
    let testCasesPassed = 0;
    let runtime = 0; // Default value for runtime
    let memory = 0; // Default value for memory

    for (const testCase of problemData.testCases) {
      const judge0Response = await axios.post(
        `${JUDGE0_URL}/submissions`,
        {
          source_code: fullCode,
          language_id: getLanguageId(language),
          stdin: testCase.apiInput,
        },
        {
          headers: JUDGE0_HEADERS,
        }
      );

      // Poll Judge0 API for the result
      const submissionId = judge0Response.data.token;
      const result = await pollJudge0Result(submissionId);

      // Extract runtime and memory from the result
      runtime = parseFloat(result.time) || 0; // Ensure runtime is a number
      memory = parseFloat(result.memory) || 0; // Ensure memory is a number

      // Check if the code failed for this test case
      if (
        result.status.id !== 3 ||
        result.stdout.trim() !== testCase.apiExpectedOutput.trim()
      ) {
        allTestCasesPassed = false;
        failedTestCase = {
          input: testCase.userInput,
          expectedOutput: testCase.userExpectedOutput,
          actualOutput: result.stdout,
          stderr: result.stderr,
          runtime, // Include runtime in the failed test case response
          memory, // Include memory in the failed test case response
        };
        break;
      } else {
        testCasesPassed++;
      }
    }

    // Convert runtime to milliseconds and memory to megabytes
    const runtimeInMilliseconds = Math.round(runtime * 1000); // Convert to milliseconds
    const memoryInMegabytes = memory / 1024; // Convert KB to MB
    const userId = req.user.userId;

    if (!allTestCasesPassed) {
      updateStatistics(
        userId,
        problemData.id,
        problemData.difficulty,
        "wrong_answer",
        code,
        language,
        runtimeInMilliseconds, // Pass converted runtime
        memoryInMegabytes, // Pass converted memory
        testCasesPassed,
        totalTestCases
      );

      return res.status(400).json({
        message: "Code failed for a test case",
        failedTestCase,
        language,
        runtimeInMilliseconds, // Pass converted runtime
        memoryInMegabytes, // Pass converted memory
        testCasesPassed,
        totalTestCases,
      });
    }

    // Update user statistics and problem statistics
    updateStatistics(
      userId,
      problemData.id,
      problemData.difficulty,
      "accepted",
      code,
      language,
      runtimeInMilliseconds, // Pass converted runtime
      memoryInMegabytes, // Pass converted memory
      testCasesPassed,
      totalTestCases
    );

    // Return success response
    res.status(200).json({
      message: "All test cases passed",
      language,
      runtimeInMilliseconds, // Pass converted runtime
      memoryInMegabytes, // Pass converted memory
      testCasesPassed,
      totalTestCases,
    });
  } catch (error) {
    console.error("Error submitting code:", error);
    res.status(500).json({ error: "Failed to submit code" });
  }
};

// Helper function to update user and problem statistics
const updateStatistics = async (
  userId: number,
  problemId: number,
  difficulty: Difficulty,
  submissionStatus: SubmissionStatus,
  code: string,
  language: string,
  runtime: number, // Add runtime parameter
  memory: number, // Add memory parameter
  testCasesPassed: number,
  totalTestCases: number
) => {
  // Update user statistics
  await prisma.stats.upsert({
    where: { userId },
    update: {
      totalSolved:
        submissionStatus === "accepted" ? { increment: 1 } : undefined,
      easySolved:
        submissionStatus === "accepted" && difficulty === "easy"
          ? { increment: 1 }
          : undefined,
      mediumSolved:
        submissionStatus === "accepted" && difficulty === "medium"
          ? { increment: 1 }
          : undefined,
      hardSolved:
        submissionStatus === "accepted" && difficulty === "hard"
          ? { increment: 1 }
          : undefined,
    },
    create: {
      userId,
      totalSolved: submissionStatus === "accepted" ? 1 : 0,
      easySolved:
        submissionStatus === "accepted" && difficulty === "easy" ? 1 : 0,
      mediumSolved:
        submissionStatus === "accepted" && difficulty === "medium" ? 1 : 0,
      hardSolved:
        submissionStatus === "accepted" && difficulty === "hard" ? 1 : 0,
    },
  });

  // Update problem statistics
  const problemStats = await prisma.problemStats.findUnique({
    where: { problemId },
  });

  const totalAttempts = (problemStats?.totalAttempts || 0) + 1;
  const totalSolved =
    (problemStats?.totalSolved || 0) +
    (submissionStatus === "accepted" ? 1 : 0);
  const acceptanceRate = (totalSolved / totalAttempts) * 100;

  await prisma.problemStats.upsert({
    where: { problemId },
    update: {
      totalAttempts: { increment: 1 },
      totalSolved:
        submissionStatus === "accepted" ? { increment: 1 } : undefined,
      acceptanceRate: acceptanceRate,
    },
    create: {
      problemId,
      totalAttempts: 1,
      totalSolved: submissionStatus === "accepted" ? 1 : 0,
      acceptanceRate: submissionStatus === "accepted" ? 100 : 0,
    },
  });

  // Add the problem to the user's solved problems if the submission is accepted
  if (submissionStatus === "accepted") {
    await prisma.solvedProblems.upsert({
      where: { userId_problemId: { userId, problemId } },
      update: {
        solvedAt: new Date(),
      },
      create: {
        userId,
        problemId,
        solvedAt: new Date(),
      },
    });
  }

  // Add the submission to the user's submissions
  await prisma.submission.create({
    data: {
      userId,
      problemId,
      status: submissionStatus,
      code: code, // Actual code
      language: language, // Actual language
      runtime: runtime, // Actual runtime
      memory: memory, // Actual memory
      testCasesPassed: testCasesPassed, // Actual test cases passed
      totalTestCases: totalTestCases, // Total test cases
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
};

// Get user submissions with optional problem title filter
export const getUserSubmissions = async (req, res, next) => {
  try {
    // Extract user ID from the JWT payload
    const userId = req.user.id || req.user.userId;

    if (!userId) {
      throw createHttpError.Unauthorized("User not authenticated");
    }

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // Get optional problem title filter
    const { title } = req.query;

    // Build the where clause
    let whereClause = { userId };

    // If title is provided, join with problem to filter by title
    if (title) {
      whereClause = {
        ...whereClause,
        problem: {
          title: {
            equals: title,
            mode: "insensitive", // Case insensitive search
          },
        },
      } as any;
    }

    // Fetch the submissions with problem details
    const submissions = await prisma.submission.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        problem: {
          select: {
            title: true,
            difficulty: true,
          },
        },
      },
    });

    // Count total submissions for pagination
    const totalSubmissions = await prisma.submission.count({
      where: whereClause,
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalSubmissions / limit);

    // Return the submissions with pagination data
    res.status(200).json({
      message: "Submissions fetched successfully",
      data: submissions,
      pagination: {
        currentPage: page,
        totalPages,
        totalSubmissions,
      },
    });
  } catch (error) {
    logger.error("Error fetching user submissions:", error);
    next(error);
  }
};

// Get all submissions for a specific problem title with pagination
export const getAllSubmissions = async (req, res, next) => {
  try {
    const { title, page } = req.query;

    if (!title) {
      throw createHttpError.BadRequest("Problem title is required");
    }

    // Get pagination parameters
    const currentPage = parseInt(page) || 1;
    const limit = 20;
    const skip = (currentPage - 1) * limit;

    // Fetch submissions for this problem by all users
    const submissions = await prisma.submission.findMany({
      where: {
        problem: {
          title: {
            equals: title,
            mode: "insensitive", // Case insensitive search
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        problem: {
          select: {
            title: true,
            difficulty: true,
          },
        },
        user: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });

    // Count total submissions for pagination
    const totalSubmissions = await prisma.submission.count({
      where: {
        problem: {
          title: {
            equals: title,
            mode: "insensitive",
          },
        },
      },
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalSubmissions / limit);

    res.status(200).json({
      message: "All problem submissions fetched successfully",
      data: submissions,
      pagination: {
        currentPage,
        totalPages,
        totalSubmissions,
      },
    });
  } catch (error) {
    logger.error("Error fetching all problem submissions:", error);
    next(error);
  }
};

// Other controllers remain the same
export const getSubmissionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user.userId;

    if (!id) {
      throw createHttpError.BadRequest("Submission ID is required");
    }

    const submission = await prisma.submission.findUnique({
      where: { id: parseInt(id) },
      include: {
        problem: {
          select: {
            title: true,
            difficulty: true,
          },
        },
      },
    });

    if (!submission) {
      throw createHttpError.NotFound("Submission not found");
    }

    // Check if the submission belongs to the authenticated user
    if (submission.userId !== userId) {
      throw createHttpError.Forbidden("Access denied");
    }

    res.status(200).json({
      message: "Submission fetched successfully",
      data: submission,
    });
  } catch (error) {
    logger.error("Error fetching submission details:", error);
    next(error);
  }
};
