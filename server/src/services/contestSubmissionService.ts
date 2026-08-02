import prisma from "../configs/db.js";
import { getIO } from "../configs/socketConfig.js";
import { unlockFirstToSolve } from "./achievementService.js";
import logger from "../configs/loggerConfig.js";

const PENALTY_MINUTES_PER_WRONG_SUBMISSION = 5;

export interface RecordContestSubmissionParams {
  contestId: number;
  contestProblemId: number;
  userId: number;
  submissionId: number;
  accepted: boolean;
}

/**
 * Called from updateStatistics (submissionController.ts) right after a
 * Submission row is created, but only when the submission happened
 * inside a contest workspace (contestId/contestProblemId were passed
 * through from submitCode). Records the ContestSubmission, applies the
 * +5m-per-wrong-submission penalty rule, updates the participant's
 * standing, and pushes the update to everyone watching the live
 * leaderboard via socket.io.
 */
export async function recordContestSubmission(params: RecordContestSubmissionParams) {
  const { contestId, contestProblemId, userId, submissionId, accepted } = params;

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) {
    logger.warn(`[contestSubmissionService] Submission ${submissionId} references unknown contest ${contestId} — skipping.`);
    return;
  }

  const submittedAtMins = Math.max(
    0,
    Math.round((Date.now() - contest.startTime.getTime()) / 60_000),
  );

  const participant = await prisma.contestParticipant.findUnique({
    where: { contestId_userId: { contestId, userId } },
  });
  if (!participant) {
    logger.warn(
      `[contestSubmissionService] Submission ${submissionId} references contest ${contestId} but user ${userId} is not a registered participant — skipping.`,
    );
    return;
  }

  // Has this user already solved this problem? If so, this submission
  // doesn't change their standing (no double-counted points, no further
  // penalty) — mirrors how Codeforces treats re-submits after an AC.
  const existingAccept = await prisma.contestSubmission.findFirst({
    where: { contestId, contestProblemId, userId, isFirstAccept: true },
  });

  const isFirstAccept = accepted && !existingAccept;

  await prisma.contestSubmission.create({
    data: {
      contestId,
      contestProblemId,
      userId,
      submissionId,
      submittedAtMins,
      isFirstAccept,
    },
  });

  if (existingAccept) {
    // Already solved earlier — nothing else to update.
    return;
  }

  if (isFirstAccept) {
    const contestProblem = await prisma.contestProblem.findUniqueOrThrow({
      where: { id: contestProblemId },
    });

    // "First to Solve" — only meaningful the very first time anyone
    // solves this problem in this contest.
    const priorAccepts = await prisma.contestSubmission.count({
      where: { contestId, contestProblemId, isFirstAccept: true, userId: { not: userId } },
    });
    if (priorAccepts === 0) {
      await unlockFirstToSolve(userId, contestId);
    }

    // Prior wrong submissions on this specific problem become the
    // penalty, applied only now that it's actually solved.
    const wrongAttempts = await prisma.contestSubmission.count({
      where: { contestId, contestProblemId, userId, isFirstAccept: false },
    });

    await prisma.contestParticipant.update({
      where: { contestId_userId: { contestId, userId } },
      data: {
        solvedCount: { increment: 1 },
        totalPoints: { increment: contestProblem.points },
        penaltyMins: { increment: wrongAttempts * PENALTY_MINUTES_PER_WRONG_SUBMISSION },
      },
    });
  } else {
    await prisma.contestParticipant.update({
      where: { contestId_userId: { contestId, userId } },
      data: { penaltyMins: { increment: PENALTY_MINUTES_PER_WRONG_SUBMISSION } },
    });
  }

  await recomputeAndBroadcastRank(contestId, userId);
}

/**
 * Recomputes this participant's rank against the field and pushes just
 * their updated row to the contest room — the client re-sorts its local
 * leaderboard rather than the server pushing the entire table on every
 * submission (cheap at scale, matches the `contest:leaderboard:update`
 * event agreed during design).
 *
 * During the last 25% of the contest (all types — see the
 * freeze-leaderboard design discussion), the DB `rank` field still
 * updates as normal, but the broadcast is suppressed — the leaderboard
 * endpoint serves Contest.frozenStandings during that window instead of
 * live data, so pushing live updates here would leak exactly what the
 * freeze is supposed to hide.
 */
async function recomputeAndBroadcastRank(contestId: number, userId: number) {
  const updated = await prisma.contestParticipant.findUnique({
    where: { contestId_userId: { contestId, userId } },
    include: { user: { select: { name: true, contestRating: true } } },
  });
  if (!updated) return;

  const better = await prisma.contestParticipant.count({
    where: {
      contestId,
      OR: [
        { totalPoints: { gt: updated.totalPoints } },
        {
          totalPoints: updated.totalPoints,
          penaltyMins: { lt: updated.penaltyMins },
        },
      ],
    },
  });
  const rank = better + 1;

  await prisma.contestParticipant.update({
    where: { contestId_userId: { contestId, userId } },
    data: { rank },
  });

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: { startTime: true, endTime: true },
  });
  if (contest) {
    const durationMs = contest.endTime.getTime() - contest.startTime.getTime();
    const freezeStartsAt = contest.endTime.getTime() - durationMs * 0.25;
    if (Date.now() >= freezeStartsAt) return; // frozen — leaderboard endpoint serves the snapshot instead
  }

  try {
    getIO()
      .to(`contest:${contestId}`)
      .emit("contest:leaderboard:update", {
        userId,
        name: updated.user.name,
        rating: updated.user.contestRating,
        rank,
        solvedCount: updated.solvedCount,
        penaltyMins: updated.penaltyMins,
        totalPoints: updated.totalPoints,
      });
  } catch (err) {
    // Socket.io not initialized (e.g. running inside a worker process
    // that doesn't host the HTTP/socket server) — safe to skip.
    logger.warn("[contestSubmissionService] Could not broadcast leaderboard update (socket.io unavailable in this process).");
  }
}
