import prisma from "../../configs/db.js";
import { ProblemContext } from "./types.js";

const hasUserSolvedProblem = async (
  userId: number,
  problemTitle: string,
): Promise<boolean> => {
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

export const getProblemContext = async (
  problemTitle: string,
  userId: number,
): Promise<ProblemContext | null> => {
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

  const hasSolved: boolean = await hasUserSolvedProblem(userId, problemTitle);

  if (!problem) return null;

  return {
    problemId: problem.id,
    problemTitle: problem.title,
    difficulty: problem.difficulty,
    userSolved: hasSolved,
  };
};
