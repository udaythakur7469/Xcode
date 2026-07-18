import prisma from "../configs/db.js";
import { getLanguageId, parseErrorPosition, processSubmissionResult, } from "../services/submissionService.js";
import { enqueueStatsUpdate } from "../queues/statsQueue.js";
import { enqueueAndWait } from "../queues/waitForJob.js";
import logger from "../configs/loggerConfig.js";
import createHttpError from "http-errors";
import { getLanguageConfig, SUPPORTED_LANGUAGES } from "../configs/languageConfig.js";
import { CacheService } from "@periodic/osmium";
import redis from "../configs/redisConfig.js";
const cache = new CacheService(redis);
export const JUDGE0_URL = process.env.JUDGE0_BASE_URL;
export const JUDGE0_HEADERS = {
    "X-Auth-Token": process.env.JUDGE0_AUTH_TOKEN,
    "Content-Type": "application/json",
};
// ─── Runtime distribution helper ─────────────────────────────────────────────
function buildRuntimeDistribution(allRuntimes, userRuntime) {
    if (allRuntimes.length === 0) {
        return [{ bucketLabel: `${userRuntime}ms`, count: 1, isUserBucket: true }];
    }
    const min = Math.min(...allRuntimes, userRuntime);
    const max = Math.max(...allRuntimes, userRuntime);
    if (min === max) {
        return [
            {
                bucketLabel: `${min}ms`,
                count: allRuntimes.length + 1,
                isUserBucket: true,
            },
        ];
    }
    const BUCKET_COUNT = 8;
    const bucketSize = Math.ceil((max - min + 1) / BUCKET_COUNT);
    const buckets = Array.from({ length: BUCKET_COUNT }, (_, i) => {
        const low = min + i * bucketSize;
        const high = low + bucketSize - 1;
        return {
            bucketLabel: low === high ? `${low}ms` : `${low}-${high}ms`,
            count: 0,
            isUserBucket: userRuntime >= low && userRuntime <= high,
        };
    });
    for (const rt of allRuntimes) {
        const idx = Math.min(Math.floor((rt - min) / bucketSize), BUCKET_COUNT - 1);
        buckets[idx].count++;
    }
    const userIdx = Math.min(Math.floor((userRuntime - min) / bucketSize), BUCKET_COUNT - 1);
    buckets[userIdx].count++;
    return buckets;
}
function computePercentile(allRuntimes, userRuntime) {
    if (allRuntimes.length === 0)
        return 100;
    const slowerCount = allRuntimes.filter((r) => r > userRuntime).length;
    return parseFloat(((slowerCount / allRuntimes.length) * 100).toFixed(1));
}
// ─── storeBaseClassCode ───────────────────────────────────────────────────────
export const storeBaseClassCode = async (req, res) => {
    const { problemId, language, baseClassCode, headerFiles, mainClassCode } = req.body;
    try {
        const problem = await prisma.problem.findUnique({
            where: { id: problemId },
        });
        if (!problem)
            return res.status(404).json({ error: "Problem not found" });
        const existingCode = await prisma.baseCode.findUnique({
            where: { problemId_language: { problemId, language } },
        });
        if (existingCode) {
            return res.status(400).json({
                error: "Base class code for this problem and language already exists",
            });
        }
        const newBaseClassCode = await prisma.baseCode.create({
            data: { problemId, language, baseClassCode, headerFiles, mainClassCode },
        });
        res.status(201).json(newBaseClassCode);
    }
    catch (error) {
        console.error("Error storing base class code:", error);
        res.status(500).json({ error: "Failed to store base class code" });
    }
};
// ─── fetchBaseClassCode ───────────────────────────────────────────────────────
export const fetchBaseClassCode = async (req, res) => {
    const { problemId, language } = req.query;
    try {
        const baseClassCode = await prisma.baseCode.findUnique({
            where: {
                problemId_language: { problemId: parseInt(problemId), language },
            },
        });
        if (!baseClassCode) {
            return res
                .status(404)
                .json({ error: "Base code not found for this problem and language" });
        }
        res.status(200).json({ baseClassCode: baseClassCode.baseClassCode });
    }
    catch (error) {
        console.error("Error fetching base class code:", error);
        res.status(500).json({ error: "Failed to fetch base class code" });
    }
};
// ─── runCode ──────────────────────────────────────────────────────────────────
export const runCode = async (req, res, next) => {
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
    if (!getLanguageConfig(language)) {
        return res.status(400).json({
            error: `Unsupported language: "${language}". Supported languages: ${SUPPORTED_LANGUAGES.join(", ")}`,
        });
    }
    let fullCode = "";
    try {
        const problemData = await prisma.problem.findFirst({
            where: { title },
            include: { testCases: true, baseCodes: true },
        });
        if (!problemData)
            return res.status(404).json({ error: "Problem not found" });
        const baseCode = problemData.baseCodes.find((b) => b.language === language);
        if (!baseCode)
            return res
                .status(404)
                .json({ error: "Base code not found for this language" });
        fullCode = `${baseCode.headerFiles || ""}\n${code}\n${baseCode.mainClassCode || ""}`;
        const { judgeRawResult: result } = await enqueueAndWait("run-code", {
            type: "run",
            userId: req.user.id ?? req.user.userId,
            language,
            fullCode,
            languageId: getLanguageId(language),
            stdin: "1\n" + problemData.testCases[0].apiInput,
            problemTitle: title,
            code,
            totalTestCasesInProblem: problemData.testCases.length,
            testCaseInput: Buffer.from(problemData.testCases[0].userInput).toString(),
            testCaseUserOutput: problemData.testCases[0].userExpectedOutput || null,
        });
        const errorInfo = parseErrorPosition(result.compile_output, language);
        let effectiveResult = result;
        if (result.status.id === 3) {
            const actualOutput = (result.stdout ?? "").trim();
            const expectedOutput = (problemData.testCases[0].apiExpectedOutput ?? "").trim();
            const passed = actualOutput === expectedOutput;
            effectiveResult = {
                ...result,
                status: passed
                    ? { id: 3, description: "Accepted" }
                    : { id: 4, description: "Wrong Answer" },
            };
        }
        const processedResult = processSubmissionResult(effectiveResult, errorInfo, language);
        // Shared metadata added to ALL runCode responses
        const runCodeMeta = {
            language,
            code,
            submittedAt: new Date().toISOString(),
            totalTestCasesInProblem: problemData.testCases.length,
        };
        if (result.status.id >= 13) {
            return res.status(200).json({
                success: false,
                status: "runtime_error",
                statusDescription: processedResult.statusDescription ?? result.status.description,
                message: "An internal error occurred in the execution engine. Please try again.",
                stderr: null,
                compile_output: null,
                errorInfo: null,
                language,
                code,
                submittedAt: new Date().toISOString(),
                totalTestCasesInProblem: problemData.testCases.length,
                testCase: null,
            });
        }
        if (!processedResult.success) {
            return res.status(200).json({
                ...processedResult,
                ...runCodeMeta,
                testCase: {
                    input: Buffer.from(problemData.testCases[0].userInput).toString(),
                    userOutput: problemData.testCases[0].userExpectedOutput || null,
                },
            });
        }
        res.status(200).json({
            message: "Code executed successfully",
            stdout: processedResult.stdout,
            time: processedResult.time,
            memory: processedResult.memory,
            status: processedResult.status,
            ...runCodeMeta,
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
function buildEarlyExitFailedTestCase(params) {
    return {
        input: null,
        expectedOutput: null,
        actualOutput: null,
        status: params.status,
        statusDescription: params.statusDescription,
        message: params.message ?? null,
        stderr: params.stderr ?? null,
        compile_output: params.compile_output ?? null,
        errorInfo: params.errorInfo ?? null,
        runtime: params.runtime ?? 0,
        memory: params.memory ?? 0,
    };
}
// ─── submitCode ───────────────────────────────────────────────────────────────
export const submitCode = async (req, res) => {
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
    if (!getLanguageConfig(language)) {
        return res.status(400).json({
            error: `Unsupported language: "${language}". Supported languages: ${SUPPORTED_LANGUAGES.join(", ")}`,
        });
    }
    let fullCode = "";
    try {
        const problemData = await prisma.problem.findFirst({
            where: { title },
            select: {
                testCases: true,
                baseCodes: true,
                id: true,
                difficulty: true,
                title: true,
            },
        });
        if (!problemData)
            return res.status(404).json({ error: "Problem not found" });
        const baseCode = problemData.baseCodes.find((b) => b.language === language);
        if (!baseCode)
            return res
                .status(404)
                .json({ error: "Base code not found for this language" });
        fullCode = `${baseCode.headerFiles || ""}\n${code}\n${baseCode.mainClassCode || ""}`;
        const totalTestCases = problemData.testCases.length;
        const combinedStdin = totalTestCases +
            "\n" +
            problemData.testCases.map((tc) => tc.apiInput).join("\n");
        console.log("full code being sent", fullCode);
        console.log("test cases are", problemData.testCases.map((tc) => ({
            apiInput: tc.apiInput,
            apiExpectedOutput: tc.apiExpectedOutput,
            userInput: tc.userInput,
            userExpectedOutput: tc.userExpectedOutput,
        })));
        const { judgeRawResult: judgeResult } = await enqueueAndWait("submit-code", {
            type: "submit",
            userId: req.user.id ?? req.user.userId,
            language,
            fullCode,
            languageId: getLanguageId(language),
            stdin: combinedStdin,
            problemTitle: title,
            code,
            problemId: problemData.id,
            difficulty: problemData.difficulty,
            testCases: problemData.testCases.map((tc) => ({
                apiInput: tc.apiInput,
                apiExpectedOutput: tc.apiExpectedOutput,
                userInput: tc.userInput,
                userExpectedOutput: tc.userExpectedOutput,
            })),
        });
        const submittedAt = new Date().toISOString();
        // ── Early-exit errors (before test case loop) ──────────────────────────
        if (judgeResult.status.id === 6) {
            const errorInfo = parseErrorPosition(judgeResult.compile_output, language);
            return res.status(200).json({
                success: false,
                status: "compilation_error",
                statusDescription: judgeResult.status.description,
                compile_output: judgeResult.compile_output,
                stderr: judgeResult.stderr,
                errorInfo,
                language,
                code,
                runtimeInMilliseconds: 0,
                memoryInMegabytes: 0,
                testCasesPassed: 0,
                totalTestCases,
                passRate: "0.0",
                avgRuntimeInMilliseconds: 0,
                submittedAt,
                testCaseResults: [],
                totalTestCasesEvaluated: 0,
                failedTestCase: buildEarlyExitFailedTestCase({
                    status: "compilation_error",
                    statusDescription: judgeResult.status.description,
                    stderr: judgeResult.stderr,
                    compile_output: judgeResult.compile_output,
                    errorInfo,
                }),
            });
        }
        if ([7, 8, 9, 10, 11, 12].includes(judgeResult.status.id)) {
            const runtimeInMilliseconds = Math.round((parseFloat(judgeResult.time) || 0) * 1000);
            const memoryInMegabytes = (parseFloat(judgeResult.memory) || 0) / 1024;
            return res.status(200).json({
                success: false,
                status: "runtime_error",
                statusDescription: judgeResult.status.description,
                stderr: judgeResult.stderr,
                language,
                code,
                runtimeInMilliseconds,
                memoryInMegabytes,
                testCasesPassed: 0,
                totalTestCases,
                passRate: "0.0",
                avgRuntimeInMilliseconds: 0,
                submittedAt,
                testCaseResults: [],
                totalTestCasesEvaluated: 0,
                failedTestCase: buildEarlyExitFailedTestCase({
                    status: "runtime_error",
                    statusDescription: judgeResult.status.description,
                    stderr: judgeResult.stderr,
                    runtime: runtimeInMilliseconds,
                    memory: memoryInMegabytes,
                }),
            });
        }
        if (judgeResult.status.id === 5) {
            const runtimeInMilliseconds = Math.round((parseFloat(judgeResult.time) || 0) * 1000);
            const memoryInMegabytes = (parseFloat(judgeResult.memory) || 0) / 1024;
            return res.status(200).json({
                success: false,
                status: "time_limit_exceeded",
                statusDescription: judgeResult.status.description,
                language,
                code,
                runtimeInMilliseconds,
                memoryInMegabytes,
                testCasesPassed: 0,
                totalTestCases,
                passRate: "0.0",
                avgRuntimeInMilliseconds: 0,
                submittedAt,
                testCaseResults: [],
                totalTestCasesEvaluated: 0,
                failedTestCase: buildEarlyExitFailedTestCase({
                    status: "time_limit_exceeded",
                    statusDescription: judgeResult.status.description,
                    message: "Your program took too long to execute. Consider optimizing your algorithm.",
                    runtime: runtimeInMilliseconds,
                    memory: memoryInMegabytes,
                }),
            });
        }
        if (judgeResult.status.id >= 13) {
            return res.status(200).json({
                success: false,
                status: "runtime_error",
                statusDescription: judgeResult.status.description,
                message: "An internal error occurred in the execution engine. Please try again.",
                language,
                code,
                runtimeInMilliseconds: 0,
                memoryInMegabytes: 0,
                testCasesPassed: 0,
                totalTestCases,
                passRate: "0.0",
                avgRuntimeInMilliseconds: 0,
                submittedAt: new Date().toISOString(),
                testCaseResults: [],
                totalTestCasesEvaluated: 0,
                failedTestCase: {
                    input: null,
                    expectedOutput: null,
                    actualOutput: null,
                    status: "runtime_error",
                    statusDescription: judgeResult.status.description,
                    message: "An internal error occurred in the execution engine.",
                    stderr: null,
                    compile_output: null,
                    errorInfo: null,
                    runtime: 0,
                    memory: 0,
                },
            });
        }
        // ── Per-test-case evaluation ───────────────────────────────────────────
        const outputs = judgeResult.stdout
            ? judgeResult.stdout.trim().split("\n")
            : [];
        const submissionResults = problemData.testCases.map((testCase, index) => {
            const actualOutput = outputs[index]?.trim() ?? "";
            const expectedOutput = testCase.apiExpectedOutput?.trim() ?? "";
            const passed = actualOutput === expectedOutput;
            const runtime = parseFloat(judgeResult.time) || 0;
            const memory = parseFloat(judgeResult.memory) || 0;
            const syntheticResult = {
                stdout: actualOutput,
                stderr: judgeResult.stderr,
                compile_output: null,
                time: judgeResult.time,
                memory: judgeResult.memory,
                status: passed
                    ? { id: 3, description: "Accepted" }
                    : { id: 4, description: "Wrong Answer" },
            };
            const processedResult = processSubmissionResult(syntheticResult, null, language);
            return {
                index,
                testCase,
                passed,
                actualOutput,
                runtime,
                memory,
                result: syntheticResult,
                processedResult,
            };
        });
        submissionResults.sort((a, b) => a.index - b.index);
        // ── Fail-fast: locate the first failing test case ─────────────────────
        // Judge0 already executed every test case in a single run (combined
        // stdin/stdout), so there is no execution cost saved here — this only
        // controls what we *report* and *store*, matching LeetCode-style
        // behavior: evaluation is treated as having stopped at the first
        // failure, and everything after it is not surfaced.
        const firstFailureIdx = submissionResults.findIndex((s) => !s.processedResult.success);
        const hasFailure = firstFailureIdx !== -1;
        // Only the cases up to and including the first failure are "evaluated".
        // Everything after that point is discarded, as if it never ran.
        const evaluatedResults = hasFailure
            ? submissionResults.slice(0, firstFailureIdx + 1)
            : submissionResults;
        // ── Build testCaseResults — truncated at the first failure ────────────
        const testCaseResults = evaluatedResults.map((s) => ({
            index: s.index + 1,
            status: s.passed ? "accepted" : "wrong_answer",
            input: s.testCase.userInput,
            expectedOutput: s.testCase.userExpectedOutput,
            actualOutput: s.actualOutput || null,
            runtimeInMilliseconds: Math.round(s.runtime * 1000),
            memoryInMegabytes: parseFloat((s.memory / 1024).toFixed(2)),
        }));
        // ── Aggregate loop — only over evaluated cases ─────────────────────────
        let allTestCasesPassed = true;
        let failedTestCase = null;
        // Consecutive passes before the first failure — this equals
        // firstFailureIdx exactly, since by definition every case before it passed.
        let testCasesPassed = hasFailure
            ? firstFailureIdx
            : evaluatedResults.length;
        let failureReason = "wrong_answer";
        let maxRuntime = 0;
        let maxMemory = 0;
        let runtimeSum = 0;
        for (const submission of evaluatedResults) {
            const { testCase, result, processedResult, runtime, memory } = submission;
            maxRuntime = Math.max(maxRuntime, runtime);
            maxMemory = Math.max(maxMemory, memory);
            runtimeSum += runtime;
            if (result.status.id >= 13) {
                return res.status(200).json({
                    success: false,
                    status: "runtime_error",
                    statusDescription: processedResult.statusDescription,
                    message: "An internal error occurred in the execution engine. Please try again.",
                    language,
                    code,
                    runtimeInMilliseconds: 0,
                    memoryInMegabytes: 0,
                    testCasesPassed: 0,
                    totalTestCases,
                    passRate: "0.0",
                    avgRuntimeInMilliseconds: 0,
                    submittedAt,
                    testCaseResults,
                    totalTestCasesEvaluated: evaluatedResults.length,
                    failedTestCase: {
                        input: null,
                        expectedOutput: null,
                        actualOutput: null,
                        status: "runtime_error",
                        statusDescription: processedResult.statusDescription,
                        message: "An internal error occurred in the execution engine.",
                        stderr: null,
                        compile_output: null,
                        errorInfo: null,
                        runtime: 0,
                        memory: 0,
                    },
                });
            }
            // First (and only, since evaluatedResults stops here) failure
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
            }
        }
        const runtimeInMilliseconds = Math.round(maxRuntime * 1000);
        const memoryInMegabytes = maxMemory / 1024;
        const avgRuntimeInMilliseconds = Math.round((runtimeSum / evaluatedResults.length) * 1000);
        const passRate = ((testCasesPassed / totalTestCases) * 100).toFixed(1);
        const userId = req.user.id || req.user.userId;
        if (!userId) {
            return res
                .status(401)
                .json({ error: "Unauthorized: could not resolve user ID" });
        }
        const submissionStatus = allTestCasesPassed
            ? "accepted"
            : failureReason === "compilation_error"
                ? "compilation_error"
                : failureReason === "runtime_error"
                    ? "runtime_error"
                    : failureReason === "time_limit_exceeded"
                        ? "time_limit_exceeded"
                        : "wrong_answer";
        const sharedFields = {
            language,
            code,
            runtimeInMilliseconds,
            memoryInMegabytes,
            testCasesPassed,
            totalTestCases,
            totalTestCasesEvaluated: evaluatedResults.length,
            passRate,
            avgRuntimeInMilliseconds,
            submittedAt,
            testCaseResults,
        };
        // ── Failure path ──────────────────────────────────────────────────────
        if (!allTestCasesPassed) {
            enqueueStatsUpdate({
                userId,
                problemId: problemData.id,
                difficulty: problemData.difficulty,
                submissionStatus,
                code,
                language,
                runtimeInMilliseconds,
                memoryInMegabytes,
                testCasesPassed,
                totalTestCases,
            }).catch((err) => {
                logger.error("Failed to enqueue statistics update (background):", err);
            });
            return res.status(200).json({
                message: `Code failed: ${failedTestCase.statusDescription || "Wrong Answer"}`,
                failedTestCase,
                ...sharedFields,
            });
        }
        // ── Success path: record + percentile ─────────────────────────────────
        enqueueStatsUpdate({
            userId,
            problemId: problemData.id,
            difficulty: problemData.difficulty,
            submissionStatus: "accepted",
            code,
            language,
            runtimeInMilliseconds,
            memoryInMegabytes,
            testCasesPassed,
            totalTestCases,
        }).catch((err) => {
            logger.error("Failed to enqueue statistics update (background):", err);
        });
        await prisma.submissionRuntime.create({
            data: { problemId: problemData.id, language, runtimeInMilliseconds },
        });
        const allRuntimeRows = await prisma.submissionRuntime.findMany({
            where: { problemId: problemData.id, language },
            select: { runtimeInMilliseconds: true },
        });
        const allRuntimes = allRuntimeRows.map((r) => r.runtimeInMilliseconds);
        // Exclude the runtime we just inserted for a fair historical comparison
        let selfExcluded = false;
        const historicalRuntimes = allRuntimes.filter((r) => {
            if (!selfExcluded && r === runtimeInMilliseconds) {
                selfExcluded = true;
                return false;
            }
            return true;
        });
        const percentile = computePercentile(historicalRuntimes, runtimeInMilliseconds);
        const runtimeDistribution = buildRuntimeDistribution(historicalRuntimes, runtimeInMilliseconds);
        res.status(200).json({
            success: true,
            message: "All test cases passed",
            percentile,
            runtimeDistribution,
            ...sharedFields,
        });
    }
    catch (error) {
        console.error("Error submitting code:", error);
        res.status(500).json({ error: "Failed to submit code" });
    }
};
// ─── updateStatistics ────────────────────────────────────────────────────────
export const updateStatistics = async (userId, problemId, difficulty, submissionStatus, code, language, runtime, memory, testCasesPassed, totalTestCases) => {
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
            acceptanceRate,
        },
        create: {
            problemId,
            totalAttempts: 1,
            totalSolved: submissionStatus === "accepted" ? 1 : 0,
            acceptanceRate: submissionStatus === "accepted" ? 100 : 0,
        },
    });
    if (submissionStatus === "accepted") {
        await prisma.solvedProblems.upsert({
            where: { userId_problemId: { userId, problemId } },
            update: { solvedAt: new Date() },
            create: { userId, problemId, solvedAt: new Date() },
        });
        const solvedAt = new Date();
        await prisma.problemRevision.createMany({
            data: [
                {
                    userId,
                    problemId,
                    reviewDate: new Date(solvedAt.getTime() + 1 * 86400000),
                }, // +1 day
                {
                    userId,
                    problemId,
                    reviewDate: new Date(solvedAt.getTime() + 7 * 86400000),
                }, // +7 days
                {
                    userId,
                    problemId,
                    reviewDate: new Date(solvedAt.getTime() + 30 * 86400000),
                }, // +30 days
            ],
            skipDuplicates: true,
        });
        cache
            .invalidateByTags([`calendar:revision:user:${userId}`])
            .catch((err) => logger.error("Failed to invalidate revision queue cache:", err));
    }
    await prisma.submission.create({
        data: {
            userId,
            problemId,
            status: submissionStatus,
            code,
            language,
            runtime,
            memory,
            testCasesPassed,
            totalTestCases,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });
};
export const getUserSubmissions = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user.userId;
        if (!userId)
            throw createHttpError.Unauthorized("User not authenticated");
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        const { title } = req.query;
        let whereClause = { userId };
        if (title) {
            whereClause = {
                ...whereClause,
                problem: { title: { equals: title, mode: "insensitive" } },
            };
        }
        const submissions = await prisma.submission.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: { problem: { select: { title: true, difficulty: true } } },
        });
        const totalSubmissions = await prisma.submission.count({
            where: whereClause,
        });
        const totalPages = Math.ceil(totalSubmissions / limit);
        res.status(200).json({
            message: "Submissions fetched successfully",
            data: submissions,
            pagination: { currentPage: page, totalPages, totalSubmissions },
        });
    }
    catch (error) {
        logger.error("Error fetching user submissions:", error);
        next(error);
    }
};
export const getAllSubmissions = async (req, res, next) => {
    try {
        const { title, page } = req.query;
        if (!title)
            throw createHttpError.BadRequest("Problem title is required");
        const currentPage = parseInt(page) || 1;
        const limit = 20;
        const skip = (currentPage - 1) * limit;
        const submissions = await prisma.submission.findMany({
            where: { problem: { title: { equals: title, mode: "insensitive" } } },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
                problem: { select: { title: true, difficulty: true } },
                user: { select: { name: true, id: true } },
            },
        });
        const totalSubmissions = await prisma.submission.count({
            where: { problem: { title: { equals: title, mode: "insensitive" } } },
        });
        const totalPages = Math.ceil(totalSubmissions / limit);
        res.status(200).json({
            message: "All problem submissions fetched successfully",
            data: submissions,
            pagination: { currentPage, totalPages, totalSubmissions },
        });
    }
    catch (error) {
        logger.error("Error fetching all problem submissions:", error);
        next(error);
    }
};
export const getSubmissionById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id || req.user.userId;
        if (!id)
            throw createHttpError.BadRequest("Submission ID is required");
        const submission = await prisma.submission.findUnique({
            where: { id: parseInt(id) },
            include: { problem: { select: { title: true, difficulty: true } } },
        });
        if (!submission)
            throw createHttpError.NotFound("Submission not found");
        if (submission.userId !== userId)
            throw createHttpError.Forbidden("Access denied");
        res
            .status(200)
            .json({ message: "Submission fetched successfully", data: submission });
    }
    catch (error) {
        logger.error("Error fetching submission details:", error);
        next(error);
    }
};
