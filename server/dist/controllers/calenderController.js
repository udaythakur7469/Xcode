import prisma from "../configs/db.js";
import createHttpError from "http-errors";
import logger from "../configs/loggerConfig.js";
/** Parse "YYYY-MM-DD" into a UTC midnight Date */
function parseIso(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}
/** Format a Date to "YYYY-MM-DD" in UTC */
function toIso(date) {
    return date.toISOString().slice(0, 10);
}
/** Return a date N days after baseDate */
function addDays(date, days) {
    return new Date(date.getTime() + days * 86400000);
}
export const getActivityData = async (req, res, next) => {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId)
        return next(createHttpError.Unauthorized());
    try {
        const since = addDays(new Date(), -365);
        // Solved problems with timestamps
        const solved = await prisma.solvedProblems.findMany({
            where: { userId, solvedAt: { gte: since } },
            select: { solvedAt: true, problemId: true },
        });
        // Revision records due today or in the future (for indicator dots)
        const revisions = await prisma.problemRevision.findMany({
            where: { userId, completed: false },
            select: { reviewDate: true },
        });
        // Today's POTD (if user solved it)
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setUTCHours(23, 59, 59, 999);
        const potdRecord = await prisma.problemOfTheDay.findFirst({
            where: { assignedDate: { gte: todayStart, lte: todayEnd } },
            include: {
                solvedBy: { where: { userId }, select: { userId: true } },
            },
        });
        // Build activity map: date → { solvedCount, hasPotdSolved, hasRevisionDue }
        const activityMap = {};
        for (const s of solved) {
            const key = toIso(s.solvedAt);
            if (!activityMap[key]) {
                activityMap[key] = {
                    solvedCount: 0,
                    hasPotdSolved: false,
                    hasRevisionDue: false,
                };
            }
            activityMap[key].solvedCount++;
        }
        for (const r of revisions) {
            const key = toIso(r.reviewDate);
            if (!activityMap[key]) {
                activityMap[key] = {
                    solvedCount: 0,
                    hasPotdSolved: false,
                    hasRevisionDue: false,
                };
            }
            activityMap[key].hasRevisionDue = true;
        }
        // Mark POTD completion for today
        if (potdRecord?.solvedBy?.length) {
            const todayKey = toIso(new Date());
            if (!activityMap[todayKey]) {
                activityMap[todayKey] = {
                    solvedCount: 0,
                    hasPotdSolved: false,
                    hasRevisionDue: false,
                };
            }
            activityMap[todayKey].hasPotdSolved = true;
        }
        const result = Object.entries(activityMap).map(([date, data]) => ({
            date,
            ...data,
        }));
        res.status(200).json(result);
    }
    catch (error) {
        logger.error("Error fetching activity data:", error);
        next(error);
    }
};
export const getDayStats = async (req, res, next) => {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId)
        return next(createHttpError.Unauthorized());
    const { date } = req.query;
    if (!date || typeof date !== "string")
        return next(createHttpError.BadRequest("date query param is required (YYYY-MM-DD)"));
    try {
        const dayStart = parseIso(date);
        const dayEnd = addDays(dayStart, 1);
        // All problems solved on this day
        const solvedRecords = await prisma.solvedProblems.findMany({
            where: { userId, solvedAt: { gte: dayStart, lt: dayEnd } },
            include: { problem: { select: { title: true, difficulty: true } } },
        });
        // All submissions attempted on this day (for "attempted" count)
        const attemptedCount = await prisma.submission.count({
            where: { userId, createdAt: { gte: dayStart, lt: dayEnd } },
        });
        // Coding time: sum of Submission.runtime (milliseconds from Judge0)
        // Submission already has a direct `runtime Int` field — no separate table needed.
        let codingTime = 0;
        try {
            const runtimes = await prisma.submission.aggregate({
                where: { userId, createdAt: { gte: dayStart, lt: dayEnd } },
                _sum: { runtime: true },
            });
            // runtime is in ms; convert to minutes for display
            codingTime = Math.round((runtimes._sum.runtime ?? 0) / 60000);
        }
        catch { }
        // POTD for this day
        const potdRecord = await prisma.problemOfTheDay.findFirst({
            where: { assignedDate: { gte: dayStart, lt: dayEnd } },
            include: {
                solvedBy: { where: { userId }, select: { userId: true } },
            },
        });
        // Revisions due today
        const revisions = await prisma.problemRevision.findMany({
            where: {
                userId,
                reviewDate: { gte: dayStart, lt: dayEnd },
                completed: false,
            },
            include: { problem: { select: { title: true, difficulty: true } } },
        });
        const difficulty = { easy: 0, medium: 0, hard: 0 };
        const solvedProblems = solvedRecords.map((r) => {
            difficulty[r.problem.difficulty]++;
            return {
                title: r.problem.title,
                difficulty: r.problem.difficulty,
                date,
            };
        });
        res.status(200).json({
            totalSolved: solvedRecords.length,
            totalAttempted: attemptedCount,
            codingTime,
            potdCompleted: (potdRecord?.solvedBy?.length ?? 0) > 0,
            revisionsdue: revisions.length,
            difficulty,
            solvedProblems,
            revisionProblems: revisions.map((r) => ({
                title: r.problem.title,
                difficulty: r.problem.difficulty,
                dueDate: date,
            })),
        });
    }
    catch (error) {
        logger.error("Error fetching day stats:", error);
        next(error);
    }
};
export const getRangeStats = async (req, res, next) => {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId)
        return next(createHttpError.Unauthorized());
    const { from, to } = req.query;
    if (!from || !to)
        return next(createHttpError.BadRequest("from and to query params are required"));
    try {
        const rangeStart = parseIso(from);
        const rangeEnd = addDays(parseIso(to), 1); // inclusive end
        const solvedRecords = await prisma.solvedProblems.findMany({
            where: { userId, solvedAt: { gte: rangeStart, lt: rangeEnd } },
            include: {
                problem: { select: { title: true, difficulty: true, tags: true } },
            },
        });
        const attemptedCount = await prisma.submission.count({
            where: { userId, createdAt: { gte: rangeStart, lt: rangeEnd } },
        });
        // Days in range
        const totalDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / 86400000);
        const dailyAverage = solvedRecords.length / totalDays;
        // Most active day
        const byDay = {};
        for (const r of solvedRecords) {
            const key = toIso(r.solvedAt);
            byDay[key] = (byDay[key] ?? 0) + 1;
        }
        const mostActiveDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        // Difficulty distribution
        const difficulty = { easy: 0, medium: 0, hard: 0 };
        const topicCounts = {};
        const solvedProblems = solvedRecords.map((r) => {
            difficulty[r.problem.difficulty]++;
            r.problem.tags.forEach((t) => {
                topicCounts[t] = (topicCounts[t] ?? 0) + 1;
            });
            return {
                title: r.problem.title,
                difficulty: r.problem.difficulty,
                date: toIso(r.solvedAt),
            };
        });
        const topicDistribution = Object.entries(topicCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([topic, count]) => ({ topic, count }));
        res.status(200).json({
            totalSolved: solvedRecords.length,
            totalAttempted: attemptedCount,
            dailyAverage: Math.round(dailyAverage * 10) / 10,
            mostActiveDay,
            difficulty,
            topicDistribution,
            solvedProblems,
        });
    }
    catch (error) {
        logger.error("Error fetching range stats:", error);
        next(error);
    }
};
export const getPotd = async (req, res, next) => {
    const userId = req.user?.userId ?? req.user?.id ?? null;
    try {
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setUTCHours(23, 59, 59, 999);
        // Check if today's POTD is already assigned
        const existing = await prisma.problemOfTheDay.findFirst({
            where: { assignedDate: { gte: todayStart, lte: todayEnd } },
            include: {
                problem: {
                    select: {
                        id: true,
                        title: true,
                        difficulty: true,
                        tags: true,
                        description: true,
                    },
                },
            },
        });
        if (existing) {
            return res.status(200).json({
                title: existing.problem.title,
                difficulty: existing.problem.difficulty,
                tags: existing.problem.tags,
                description: existing.problem.description.slice(0, 200),
            });
        }
        // Select a new POTD:
        // 1. Get problems solved in last 7 days to avoid repetition
        const recentIds = [];
        if (userId) {
            const recent = await prisma.solvedProblems.findMany({
                where: { userId, solvedAt: { gte: addDays(new Date(), -7) } },
                select: { problemId: true },
            });
            recent.forEach((r) => recentIds.push(r.problemId));
        }
        const candidates = await prisma.problem.findMany({
            where: { id: { notIn: recentIds } },
            select: {
                id: true,
                title: true,
                difficulty: true,
                tags: true,
                description: true,
            },
            take: 50,
            orderBy: { createdAt: "asc" },
        });
        if (candidates.length === 0) {
            return res.status(404).json({ message: "No POTD available" });
        }
        // Weighted random: prefer medium, then hard, then easy
        const weights = { easy: 1, medium: 3, hard: 2 };
        const totalWeight = candidates.reduce((sum, p) => sum + (weights[p.difficulty] ?? 1), 0);
        let rand = Math.random() * totalWeight;
        let chosen = candidates[0];
        for (const c of candidates) {
            rand -= weights[c.difficulty] ?? 1;
            if (rand <= 0) {
                chosen = c;
                break;
            }
        }
        // Persist today's POTD
        await prisma.problemOfTheDay.create({
            data: { problemId: chosen.id, assignedDate: todayStart },
        });
        return res.status(200).json({
            title: chosen.title,
            difficulty: chosen.difficulty,
            tags: chosen.tags,
            description: chosen.description.slice(0, 200),
        });
    }
    catch (error) {
        logger.error("Error fetching POTD:", error);
        next(error);
    }
};
export const getRevisionQueue = async (req, res, next) => {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId)
        return next(createHttpError.Unauthorized());
    try {
        const today = new Date();
        today.setUTCHours(23, 59, 59, 999);
        // Fetch ALL due rows first — do not slice here, dedup happens before slicing
        const revisions = await prisma.problemRevision.findMany({
            where: { userId, reviewDate: { lte: today }, completed: false },
            include: { problem: { select: { title: true, difficulty: true } } },
            orderBy: { reviewDate: "asc" },
            // NOTE: `take: 10` removed from here — was slicing BEFORE dedup,
            // which is what let duplicate problems consume queue slots.
        });
        const now = new Date();
        now.setUTCHours(0, 0, 0, 0);
        // Deduplicate by problemId — keep the earliest reviewDate per problem.
        // Rows are already ordered by reviewDate asc, so the first occurrence
        // of each problemId encountered is guaranteed to be the earliest one.
        const seen = new Map();
        for (const r of revisions) {
            if (!seen.has(r.problemId)) {
                seen.set(r.problemId, r);
            }
        }
        const deduplicated = Array.from(seen.values()).slice(0, 10);
        const result = deduplicated.map((r) => {
            const dueDate = new Date(r.reviewDate);
            dueDate.setUTCHours(0, 0, 0, 0);
            const diffDays = Math.round((now.getTime() - dueDate.getTime()) / 86400000);
            const isOverdue = diffDays > 0;
            let dueDateStr;
            if (diffDays === 0)
                dueDateStr = "Due today";
            else if (diffDays === 1)
                dueDateStr = "Due yesterday";
            else if (diffDays > 1)
                dueDateStr = `Due ${diffDays} days ago`;
            else if (diffDays === -1)
                dueDateStr = "Due tomorrow";
            else
                dueDateStr = `Due in ${Math.abs(diffDays)} days`;
            return {
                title: r.problem.title,
                difficulty: r.problem.difficulty,
                dueDate: dueDateStr,
                isOverdue,
            };
        });
        res.status(200).json(result);
    }
    catch (error) {
        logger.error("Error fetching revision queue:", error);
        next(error);
    }
};
// ─────────────────────────────────────────────────────────────────────────────
// POST /calendar/markRevisionDone?title=<problemTitle>
//
// Marks ALL due (completed: false) ProblemRevision rows for this user +
// problem as completed in a single updateMany. This is what lets the
// deduplicated queue entry (above) fully clear in one user action, no
// matter how many +1/+7/+30-day rows were due for that problem.
//
// Guard: the user must already have an accepted Submission for this
// problem. The frontend also locks the button until a correct submission
// happens in the current session, but this is checked again server-side
// so the endpoint can't be called directly to skip that requirement.
// ─────────────────────────────────────────────────────────────────────────────
export const markRevisionDone = async (req, res, next) => {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId)
        return next(createHttpError.Unauthorized());
    const { title } = req.query;
    if (!title || typeof title !== "string")
        return next(createHttpError.BadRequest("title query param is required"));
    try {
        const problem = await prisma.problem.findFirst({
            where: { title: { equals: title, mode: "insensitive" } },
            select: { id: true },
        });
        if (!problem)
            return next(createHttpError.NotFound("Problem not found"));
        // Safety guard — user must have at least one accepted submission
        const acceptedSubmission = await prisma.submission.findFirst({
            where: { userId, problemId: problem.id, status: "accepted" },
            select: { id: true },
        });
        if (!acceptedSubmission) {
            return res.status(403).json({
                message: "Solve the problem correctly before marking revision as done",
            });
        }
        // Mark ALL due revisions for this user + problem as completed at once
        const result = await prisma.problemRevision.updateMany({
            where: { userId, problemId: problem.id, completed: false },
            data: { completed: true },
        });
        res.status(200).json({
            message: "Revision marked as done",
            revisionsCompleted: result.count,
        });
    }
    catch (error) {
        logger.error("Error marking revision as done:", error);
        next(error);
    }
};
