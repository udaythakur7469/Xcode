import axios from "axios";
import prisma from "../configs/db.js";
import { getLanguageId, parseErrorPosition, processSubmissionResult, } from "../services/submissionService.js";
import logger from "../configs/loggerConfig.js";
import createHttpError from "http-errors";
import { captureJudgeResponse } from "../utils/judgeResponseLogger.js";
export const JUDGE0_URL = process.env.JUDGE0_BASE_URL;
export const JUDGE0_HEADERS = {
    "X-Auth-Token": process.env.JUDGE0_AUTH_TOKEN,
    "Content-Type": "application/json",
};
export const storeBaseClassCode = async (req, res) => {
    const { problemId, language, baseClassCode, headerFiles, mainClassCode } = req.body;
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    let fullCode = "";
    captureJudgeResponse(res, "runCode", language, () => fullCode);
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
        const baseCode = problemData.baseCodes.find((baseCode) => baseCode.language === language);
        if (!baseCode) {
            return res
                .status(404)
                .json({ error: "Base code not found for this language" });
        }
        // Add a newline after every line in the user's code
        // Combine the header files, formatted user's code, and main class code
        fullCode = `${baseCode.headerFiles || ""}\n${code}\n${baseCode.mainClassCode || ""}`;
        console.log("Full code being sent:", fullCode); // For debugging
        // Send the code to Judge0 API
        const judge0Response = await axios.post(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, {
            source_code: Buffer.from(fullCode).toString("base64"), // Encode the source code
            language_id: getLanguageId(language), // Map language to Judge0 language ID
            stdin: Buffer.from("1\n" + problemData.testCases[0].apiInput).toString("base64"),
        }, {
            headers: JUDGE0_HEADERS,
        });
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
            result.compile_output = Buffer.from(result.compile_output, "base64").toString();
        }
        const errorInfo = parseErrorPosition(result.compile_output, language);
        // Process the submission result based on status code
        const processedResult = processSubmissionResult(result, errorInfo, language);
        // Handle internal errors (status >= 13)
        if (result.status.id >= 13) {
            return res.status(500).json({
                error: "Internal server error",
                message: "message" in processedResult
                    ? processedResult.message
                    : "An error occurred",
                statusDescription: processedResult.statusDescription,
            });
        }
        // Handle non-accepted submissions (compilation errors, runtime errors, etc.)
        if (!processedResult.success) {
            return res.status(400).json({
                ...processedResult,
                testCase: {
                    input: Buffer.from(problemData.testCases[0].userInput).toString(),
                    userOutput: problemData.testCases[0].userExpectedOutput || null,
                },
            });
        }
        // Return successful execution
        res.status(200).json({
            message: "Code executed successfully",
            stdout: processedResult.stdout, // This is safe because SuccessResult has stdout
            time: processedResult.time,
            memory: processedResult.memory,
            status: processedResult.status,
            testCase: {
                input: Buffer.from(problemData.testCases[0].userInput).toString(),
                userOutput: problemData.testCases[0].userExpectedOutput || null,
            },
        });
    }
    catch (error) {
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
    const { title } = req.query;
    if (!title || typeof title !== "string") {
        return res
            .status(400)
            .json({ message: "Title is required as a query parameter" });
    }
    let fullCode = "";
    captureJudgeResponse(res, "submitCode", language, () => fullCode);
    try {
        // Fetch the problem details, including test cases and base code
        const problemData = await prisma.problem.findFirst({
            where: { title },
            select: {
                testCases: true,
                baseCodes: true,
                id: true,
                difficulty: true,
            },
        });
        if (!problemData) {
            return res.status(404).json({ error: "Problem not found" });
        }
        // Fetch the base code for the selected language
        const baseCode = problemData.baseCodes.find((baseCode) => baseCode.language === language);
        if (!baseCode) {
            return res
                .status(404)
                .json({ error: "Base code not found for this language" });
        }
        // Combine the header files, formatted user's code, and main class code
        fullCode = `${baseCode.headerFiles || ""}\n${code}\n${baseCode.mainClassCode || ""}`;
        console.log("Full code being sent:", fullCode);
        const totalTestCases = problemData.testCases.length;
        // Combine ALL test cases into one stdin
        const combinedStdin = totalTestCases +
            "\n" +
            problemData.testCases.map((tc) => tc.apiInput).join("\n");
        console.log("Combined stdin:", combinedStdin);
        // Send ONE single job to Judge0
        const judge0Response = await axios.post(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, {
            source_code: Buffer.from(fullCode).toString("base64"),
            language_id: getLanguageId(language),
            stdin: Buffer.from(combinedStdin).toString("base64"),
        }, {
            headers: JUDGE0_HEADERS,
            timeout: 30000,
        });
        const judgeResult = judge0Response.data;
        // Decode outputs
        if (judgeResult.stdout) {
            judgeResult.stdout = Buffer.from(judgeResult.stdout, "base64").toString();
        }
        if (judgeResult.stderr) {
            judgeResult.stderr = Buffer.from(judgeResult.stderr, "base64").toString();
        }
        if (judgeResult.compile_output) {
            judgeResult.compile_output = Buffer.from(judgeResult.compile_output, "base64").toString();
        }
        // Handle compilation error
        if (judgeResult.status.id === 6) {
            const errorInfo = parseErrorPosition(judgeResult.compile_output, language);
            return res.status(400).json({
                success: false,
                status: "compilation_error",
                statusDescription: judgeResult.status.description,
                compile_output: judgeResult.compile_output,
                stderr: judgeResult.stderr,
                errorInfo,
            });
        }
        // Handle runtime error
        if ([7, 8, 9, 10, 11, 12].includes(judgeResult.status.id)) {
            return res.status(400).json({
                success: false,
                status: "runtime_error",
                statusDescription: judgeResult.status.description,
                stderr: judgeResult.stderr,
                time: judgeResult.time,
                memory: judgeResult.memory,
            });
        }
        // Handle time limit exceeded
        if (judgeResult.status.id === 5) {
            return res.status(400).json({
                success: false,
                status: "time_limit_exceeded",
                statusDescription: judgeResult.status.description,
                time: judgeResult.time,
                memory: judgeResult.memory,
            });
        }
        // Handle internal error
        if (judgeResult.status.id >= 13) {
            return res.status(500).json({
                error: "Internal server error occurred during submission",
                statusDescription: judgeResult.status.description,
            });
        }
        // Split output by newline — one line per test case
        const outputs = judgeResult.stdout
            ? judgeResult.stdout.trim().split("\n")
            : [];
        console.log("Outputs:", outputs);
        // Build submissionResults in same format as before
        const submissionResults = problemData.testCases.map((testCase, index) => {
            const actualOutput = outputs[index]?.trim() || "";
            const expectedOutput = testCase.apiExpectedOutput?.trim() || "";
            const passed = actualOutput === expectedOutput;
            return {
                index,
                testCase,
                result: {
                    stdout: actualOutput,
                    stderr: judgeResult.stderr,
                    status: passed
                        ? { id: 3, description: "Accepted" }
                        : { id: 4, description: "Wrong Answer" },
                    time: judgeResult.time,
                    memory: judgeResult.memory,
                },
                processedResult: passed
                    ? {
                        success: true,
                        status: "accepted",
                        statusDescription: "Accepted",
                        stdout: actualOutput,
                        time: judgeResult.time,
                        memory: judgeResult.memory,
                    }
                    : {
                        success: false,
                        status: "wrong_answer",
                        statusDescription: "Wrong Answer",
                        stdout: actualOutput,
                    },
                runtime: parseFloat(judgeResult.time) || 0,
                memory: parseFloat(judgeResult.memory) || 0,
            };
        });
        // Process results to find first failure
        let allTestCasesPassed = true;
        let failedTestCase = null;
        let testCasesPassed = 0;
        let failureReason = "wrong_answer";
        let maxRuntime = 0;
        let maxMemory = 0;
        // Sort by index to maintain original test case order
        submissionResults.sort((a, b) => a.index - b.index);
        for (const submission of submissionResults) {
            const { testCase, result, processedResult, runtime, memory } = submission;
            // Track maximum runtime and memory across all test cases
            maxRuntime = Math.max(maxRuntime, runtime);
            maxMemory = Math.max(maxMemory, memory);
            // Handle internal errors
            if (result.status.id >= 13) {
                return res.status(500).json({
                    error: "Internal server error occurred during submission",
                    message: processedResult.message || "An error occurred",
                    statusDescription: processedResult.statusDescription,
                });
            }
            // Check if submission failed (not accepted)
            if (!processedResult.success && !failedTestCase) {
                allTestCasesPassed = false;
                const errorResult = processedResult;
                failureReason = errorResult.status;
                failedTestCase = {
                    input: testCase.userInput,
                    expectedOutput: testCase.userExpectedOutput,
                    actualOutput: result.stdout || null,
                    status: errorResult.status,
                    statusDescription: errorResult.statusDescription,
                    message: errorResult.message,
                    stderr: errorResult.stderr,
                    compile_output: errorResult.compile_output,
                    errorInfo: errorResult.errorInfo,
                    runtime,
                    memory,
                };
                // Don't break - continue to check for internal errors in remaining results
                continue;
            }
            // Check if output matches expected output
            if (result.stdout !== testCase.apiExpectedOutput && !failedTestCase) {
                allTestCasesPassed = false;
                failureReason = "wrong_answer";
                failedTestCase = {
                    input: testCase.userInput,
                    expectedOutput: testCase.userExpectedOutput,
                    actualOutput: result.stdout,
                    status: "wrong_answer",
                    statusDescription: "Wrong Answer",
                    stderr: result.stderr,
                    runtime,
                    memory,
                };
                // Don't break - continue to check for internal errors in remaining results
                continue;
            }
            // Only increment if this test case passed
            if (processedResult.success &&
                result.stdout === testCase.apiExpectedOutput) {
                testCasesPassed++;
            }
        }
        const runtimeInMilliseconds = Math.round(maxRuntime * 1000);
        const memoryInMegabytes = maxMemory / 1024;
        const userId = req.user.userId;
        // Map failure reason to submission status
        const submissionStatus = allTestCasesPassed
            ? "accepted"
            : failureReason === "compilation_error"
                ? "compilation_error"
                : failureReason === "runtime_error"
                    ? "runtime_error"
                    : failureReason === "time_limit_exceeded"
                        ? "time_limit_exceeded"
                        : "wrong_answer";
        if (!allTestCasesPassed) {
            updateStatistics(userId, problemData.id, problemData.difficulty, submissionStatus, code, language, runtimeInMilliseconds, memoryInMegabytes, testCasesPassed, totalTestCases);
            return res.status(400).json({
                message: `Code failed: ${failedTestCase.statusDescription || "Wrong Answer"}`,
                failedTestCase,
                language,
                runtimeInMilliseconds,
                memoryInMegabytes,
                testCasesPassed,
                totalTestCases,
            });
        }
        updateStatistics(userId, problemData.id, problemData.difficulty, "accepted", code, language, runtimeInMilliseconds, memoryInMegabytes, testCasesPassed, totalTestCases);
        res.status(200).json({
            message: "All test cases passed",
            language,
            runtimeInMilliseconds,
            memoryInMegabytes,
            testCasesPassed,
            totalTestCases,
        });
    }
    catch (error) {
        console.error("Error submitting code:", error);
        res.status(500).json({ error: "Failed to submit code" });
    }
};
// Helper function to update user and problem statistics
const updateStatistics = async (userId, problemId, difficulty, submissionStatus, code, language, runtime, // Add runtime parameter
memory, // Add memory parameter
testCasesPassed, totalTestCases) => {
    // Update user statistics
    await prisma.stats.upsert({
        where: { userId },
        update: {
            totalSolved: submissionStatus === "accepted" ? { increment: 1 } : undefined,
            easySolved: submissionStatus === "accepted" && difficulty === "easy"
                ? { increment: 1 }
                : undefined,
            mediumSolved: submissionStatus === "accepted" && difficulty === "medium"
                ? { increment: 1 }
                : undefined,
            hardSolved: submissionStatus === "accepted" && difficulty === "hard"
                ? { increment: 1 }
                : undefined,
        },
        create: {
            userId,
            totalSolved: submissionStatus === "accepted" ? 1 : 0,
            easySolved: submissionStatus === "accepted" && difficulty === "easy" ? 1 : 0,
            mediumSolved: submissionStatus === "accepted" && difficulty === "medium" ? 1 : 0,
            hardSolved: submissionStatus === "accepted" && difficulty === "hard" ? 1 : 0,
        },
    });
    // Update problem statistics
    const problemStats = await prisma.problemStats.findUnique({
        where: { problemId },
    });
    const totalAttempts = (problemStats?.totalAttempts || 0) + 1;
    const totalSolved = (problemStats?.totalSolved || 0) +
        (submissionStatus === "accepted" ? 1 : 0);
    const acceptanceRate = (totalSolved / totalAttempts) * 100;
    await prisma.problemStats.upsert({
        where: { problemId },
        update: {
            totalAttempts: { increment: 1 },
            totalSolved: submissionStatus === "accepted" ? { increment: 1 } : undefined,
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
            };
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        logger.error("Error fetching submission details:", error);
        next(error);
    }
};
