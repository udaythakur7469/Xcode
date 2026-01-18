import prisma from "../../configs/db.js";
const hasUserSolvedProblem = async (userId, problemTitle) => {
    const record = await prisma.solvedProblems.findFirst({
        where: {
            userId,
            problem: {
                title: problemTitle,
            },
        },
        select: { id: true },
    });
    return !!record;
};
export const getProblemContext = async (problemTitle, userId) => {
    const problem = await prisma.problem.findFirst({
        where: { title: problemTitle },
        select: {
            id: true,
            title: true,
            difficulty: true,
            solvedProblems: {
                where: { userId },
                select: { id: true },
            },
        },
    });
    const hasSolved = await hasUserSolvedProblem(userId, problemTitle);
    if (!problem)
        return null;
    return {
        problemId: problem.id,
        problemTitle: problem.title,
        difficulty: problem.difficulty,
        userSolved: hasSolved,
    };
};
