// server/src/services/rag/contentQueryFetcher.ts
//
// Fetches public/content data from the DB for ContentIntent queries:
// PROBLEM_POSTS, POST_COMMENTS, TEST_CASES, PROBLEM_STATS.
//
// These differ from personalDataFetcher — they're not user-specific.
// Problem title or postId extracted by generalIntentRouter is used to scope the query.
import prisma from "../../configs/db.js";
import logger from "../../configs/loggerConfig.js";
// ─── Main dispatcher ──────────────────────────────────────────────────────────
export async function fetchContentData(input) {
    const { intent } = input;
    try {
        switch (intent) {
            case "PROBLEM_POSTS":
                return await fetchProblemPosts(input);
            case "POST_COMMENTS":
                return await fetchPostComments(input);
            case "TEST_CASES":
                return await fetchTestCases(input);
            case "PROBLEM_STATS":
                return await fetchProblemStats(input);
            default:
                return {
                    intent,
                    found: false,
                    data: {},
                    summary: "No content handler for this intent.",
                };
        }
    }
    catch (err) {
        logger.error(`[contentQueryFetcher] failed for intent=${intent}`, err);
        return {
            intent,
            found: false,
            data: { error: err.message },
            summary: "I ran into an error fetching that content. Please try again.",
        };
    }
}
// ─── PROBLEM_POSTS ────────────────────────────────────────────────────────────
async function fetchProblemPosts(input) {
    const { extractedProblemTitle, currentProblemId } = input;
    // Resolve problem — prefer currentProblemId from context, fall back to title search
    let problemId = currentProblemId;
    if (!problemId && extractedProblemTitle) {
        const problem = await prisma.problem.findFirst({
            where: { title: { contains: extractedProblemTitle, mode: "insensitive" } },
            select: { id: true, title: true },
        });
        if (problem)
            problemId = problem.id;
    }
    if (!problemId) {
        return {
            intent: "PROBLEM_POSTS",
            found: false,
            data: {},
            summary: "I need to know which problem you're asking about. Could you mention the problem name?",
        };
    }
    const posts = await prisma.post.findMany({
        where: { problemId, isDraftPost: false },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            author: { select: { name: true } },
            tags: { select: { name: true } },
            _count: { select: { comments: true, postReactions: true } },
        },
    });
    const problem = await prisma.problem.findUnique({
        where: { id: problemId },
        select: { title: true },
    });
    return {
        intent: "PROBLEM_POSTS",
        found: posts.length > 0,
        data: { posts, problemTitle: problem?.title, totalCount: posts.length },
        summary: posts.length === 0
            ? `No community posts yet for ${problem?.title ?? "this problem"}.`
            : `Found ${posts.length} community post(s) for ${problem?.title ?? "this problem"}.`,
    };
}
// ─── POST_COMMENTS ────────────────────────────────────────────────────────────
async function fetchPostComments(input) {
    const { extractedPostId } = input;
    if (!extractedPostId) {
        return {
            intent: "POST_COMMENTS",
            found: false,
            data: {},
            summary: "I need a specific post to fetch comments for. Could you mention the post title or ID?",
        };
    }
    const post = await prisma.post.findUnique({
        where: { id: extractedPostId },
        select: {
            title: true,
            comments: {
                where: { parentId: null }, // top-level only
                orderBy: { createdAt: "desc" },
                take: 10,
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    author: { select: { name: true } },
                    _count: { select: { replies: true, votes: true } },
                },
            },
        },
    });
    if (!post) {
        return {
            intent: "POST_COMMENTS",
            found: false,
            data: {},
            summary: "Couldn't find that post.",
        };
    }
    return {
        intent: "POST_COMMENTS",
        found: post.comments.length > 0,
        data: { postTitle: post.title, comments: post.comments },
        summary: post.comments.length === 0
            ? `No comments on "${post.title}" yet.`
            : `Found ${post.comments.length} top-level comment(s) on "${post.title}".`,
    };
}
// ─── TEST_CASES ───────────────────────────────────────────────────────────────
async function fetchTestCases(input) {
    const { extractedProblemTitle, currentProblemId } = input;
    let problemId = currentProblemId;
    if (!problemId && extractedProblemTitle) {
        const problem = await prisma.problem.findFirst({
            where: { title: { contains: extractedProblemTitle, mode: "insensitive" } },
            select: { id: true },
        });
        if (problem)
            problemId = problem.id;
    }
    if (!problemId) {
        return {
            intent: "TEST_CASES",
            found: false,
            data: {},
            summary: "Which problem's test cases are you asking about?",
        };
    }
    const problem = await prisma.problem.findUnique({
        where: { id: problemId },
        select: {
            title: true,
            examples: {
                take: 3,
                select: { input: true, output: true, explanation: true },
            },
            // Return only user-visible fields (not apiInput which has internal format)
            testCases: {
                take: 3,
                select: { userInput: true, userExpectedOutput: true },
            },
        },
    });
    if (!problem) {
        return {
            intent: "TEST_CASES",
            found: false,
            data: {},
            summary: "Couldn't find that problem.",
        };
    }
    return {
        intent: "TEST_CASES",
        found: true,
        data: {
            problemTitle: problem.title,
            examples: problem.examples,
            sampleTestCases: problem.testCases,
        },
        summary: `Here are the examples and sample test cases for "${problem.title}".`,
    };
}
// ─── PROBLEM_STATS ────────────────────────────────────────────────────────────
async function fetchProblemStats(input) {
    const { extractedProblemTitle, currentProblemId } = input;
    let problemId = currentProblemId;
    if (!problemId && extractedProblemTitle) {
        const problem = await prisma.problem.findFirst({
            where: { title: { contains: extractedProblemTitle, mode: "insensitive" } },
            select: { id: true },
        });
        if (problem)
            problemId = problem.id;
    }
    if (!problemId) {
        return {
            intent: "PROBLEM_STATS",
            found: false,
            data: {},
            summary: "Which problem's stats are you asking about?",
        };
    }
    const problemStats = await prisma.problemStats.findUnique({
        where: { problemId },
        select: {
            totalAttempts: true,
            totalSolved: true,
            acceptanceRate: true,
            problem: { select: { title: true, difficulty: true } },
        },
    });
    if (!problemStats) {
        return {
            intent: "PROBLEM_STATS",
            found: false,
            data: {},
            summary: "No stats available for this problem yet.",
        };
    }
    return {
        intent: "PROBLEM_STATS",
        found: true,
        data: problemStats,
        summary: `"${problemStats.problem.title}" (${problemStats.problem.difficulty}): ${problemStats.totalSolved}/${problemStats.totalAttempts} solved, ${(problemStats.acceptanceRate * 100).toFixed(1)}% acceptance rate.`,
    };
}
