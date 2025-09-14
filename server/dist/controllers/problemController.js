import prisma from "../configs/db.js";
import createHttpError from "http-errors";
import logger from "../configs/loggerConfig.js";
export const createProblem = async (req, res, next) => {
    try {
        const { title, description, difficulty, tags, examples, testCases, hints, } = req.body;
        if (!title ||
            !description ||
            !difficulty ||
            !tags ||
            !examples ||
            !testCases ||
            !hints) {
            throw createHttpError.BadRequest("Please fill all fields");
        }
        if (examples.length === 0 || testCases.length === 0 || hints.length === 0) {
            throw createHttpError.BadRequest("Examples and test cases cannot be empty");
        }
        const newProblem = await prisma.problem.create({
            data: {
                title,
                description,
                difficulty,
                tags,
                solved: false,
                examples: {
                    create: examples,
                },
                testCases: {
                    create: testCases,
                },
                hints: {
                    create: hints.map((hint) => ({ hint })),
                },
                problemStats: {
                    create: {
                        totalAttempts: 0,
                        totalSolved: 0,
                        acceptanceRate: 0,
                    },
                },
            },
            include: {
                examples: true,
                testCases: true,
                hints: true,
                problemStats: true,
            },
        });
        res
            .status(201)
            .json({ message: "problem created successfully", problem: newProblem });
    }
    catch (error) {
        logger.error("error in creating problem", error);
        next(error);
    }
};
export const getProblems = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        const difficulty = req.query.difficulty;
        const status = req.query.status;
        const tags = req.query.tags;
        const whereClause = {};
        if (difficulty)
            whereClause.difficulty = difficulty; // Apply difficulty filter if provided
        if (status !== undefined)
            whereClause.solved = status === "solved"; // Apply status filter only if status is provided
        if (tags) {
            const tagsArray = tags.split(","); // Convert comma-separated string to array
            whereClause.tags = { hasSome: tagsArray }; // Filter by tags
        }
        const problems = await prisma.problem.findMany({
            where: whereClause,
            skip,
            take: limit,
            select: {
                title: true,
                difficulty: true,
                solved: true,
                problemStats: {
                    select: {
                        totalAttempts: true,
                        totalSolved: true,
                    },
                },
            },
        });
        // Calculate acceptance rate for each problem
        const formattedProblems = problems.map((problem) => ({
            title: problem.title,
            difficulty: problem.difficulty,
            acceptanceRate: problem.problemStats?.totalAttempts > 0
                ? (problem.problemStats.totalSolved /
                    problem.problemStats.totalAttempts) *
                    100
                : 0,
            solved: problem.solved,
        }));
        // Get total number of problems for pagination
        const totalProblems = await prisma.problem.count({
            where: whereClause, // Apply the same filter for counting
        });
        res.status(200).json({
            message: "Problems fetched successfully",
            data: formattedProblems,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalProblems / limit),
                totalProblems,
            },
        });
    }
    catch (error) {
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
                    { title: { contains: query, mode: "insensitive" } },
                    { tags: { hasSome: [query] } },
                ],
            },
        });
        res.status(200).json(problems);
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        next(error);
    }
};
export const addEditorials = async (req, res, next) => {
    try {
        const { problemId, videoUrl, bruteForceTitle, bruteForceIntuition, bruteForceAlgorithm, bruteForceCodeCpp, bruteForceCodeJs, bruteForceCodePython, bruteForceCodeJava, bruteForceTimeComplexity, bruteForceSpaceComplexity, betterTitle, betterIntuition, betterAlgorithm, betterCodeCpp, betterCodeJs, betterCodePython, betterCodeJava, betterTimeComplexity, betterSpaceComplexity, optimalTitle, optimalIntuition, optimalAlgorithm, optimalCodeCpp, optimalCodeJs, optimalCodePython, optimalCodeJava, optimalTimeComplexity, optimalSpaceComplexity, } = req.body;
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
    }
    catch (error) {
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
    }
    catch (error) {
        logger.error("Error fetching editorial by problem title:", error);
        next(error);
    }
};
export const problemReaction = async (req, res, next) => {
    const { title } = req.query; // Get the title from the query parameters
    const { action } = req.body; // 'like' or 'dislike'
    // Extract user ID from the JWT payload that was attached by the authMiddleware
    // The payload structure depends on how you created the JWT
    const userId = req.user.id || req.user.userId; // Handle different payload structures
    // Validate inputs
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
        // Find the problem by title
        const problem = await prisma.problem.findFirst({
            where: { title },
            select: { id: true },
        });
        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }
        // Calculate current likes and dislikes directly from UserProblemReactions
        const [currentLikes, currentDislikes] = await prisma.$transaction([
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
        // Check if the user has already reacted to this problem
        const existingReaction = await prisma.userProblemReactions.findUnique({
            where: {
                userId_problemId: {
                    userId: userId,
                    problemId: problem.id,
                },
            },
        });
        // Handle different scenarios based on existing reaction and new action
        if (!existingReaction) {
            // Case 1: No previous reaction, add new reaction
            await prisma.userProblemReactions.create({
                data: {
                    userId: userId,
                    problemId: problem.id,
                    reactionType: action === "like" ? "like" : "dislike",
                },
            });
            return res.status(200).json({
                message: `${action === "like" ? "Like" : "Dislike"} added successfully`,
                likes: action === "like" ? currentLikes + 1 : currentLikes,
                dislikes: action === "dislike" ? currentDislikes + 1 : currentDislikes,
            });
        }
        else if (existingReaction.reactionType === (action === "like" ? "like" : "dislike")) {
            // Case 2: User clicked the same reaction again, remove it
            await prisma.userProblemReactions.delete({
                where: {
                    userId_problemId: {
                        userId: userId,
                        problemId: problem.id,
                    },
                },
            });
            return res.status(200).json({
                message: `${action === "like" ? "Like" : "Dislike"} removed successfully`,
                likes: action === "like" ? currentLikes - 1 : currentLikes,
                dislikes: action === "dislike" ? currentDislikes - 1 : currentDislikes,
            });
        }
        else {
            // Case 3: User had opposite reaction before, switch reaction
            await prisma.userProblemReactions.update({
                where: {
                    userId_problemId: {
                        userId: userId,
                        problemId: problem.id,
                    },
                },
                data: {
                    reactionType: action === "like" ? "like" : "dislike",
                },
            });
            const newLikes = existingReaction.reactionType === "like"
                ? currentLikes - 1
                : currentLikes + 1;
            const newDislikes = existingReaction.reactionType === "dislike"
                ? currentDislikes - 1
                : currentDislikes + 1;
            return res.status(200).json({
                message: `Changed from ${existingReaction.reactionType} to ${action}`,
                likes: newLikes,
                dislikes: newDislikes,
            });
        }
    }
    catch (error) {
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
    }
    catch (error) {
        console.error("Error fetching problem reactions:", error);
        return res.status(500).json({
            message: "Server error while fetching reactions",
        });
    }
};
export const addTestCases = async (req, res, next) => {
    try {
        const { problemId, userInput, apiInput, userExpectedOutput, apiExpectedOutput, } = req.body;
        // Validate required fields
        if (!problemId ||
            !userInput ||
            !apiInput ||
            !userExpectedOutput ||
            !apiExpectedOutput) {
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
    }
    catch (error) {
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
            throw createHttpError.NotFound("unable to find problem for the requested problem title");
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
    }
    catch (error) {
        logger.error("Error fetching editorial by problem title:", error);
        next(error);
    }
};
