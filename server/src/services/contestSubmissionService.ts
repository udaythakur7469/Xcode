import prisma from "../configs/db.js";
import logger from "../configs/loggerConfig.js";
import { getIO } from "../configs/socketConfig.js";
import { unlockFirstToSolve } from "./achievementService.js";

// ─── contestSubmissionService ────────────────────────────────────────────
//
// This is where a normal, already-judged Submission gets contest
// bookkeeping bolted on — called from statsWorker.ts, after the core
// stats-updating logic runs, exactly the same way for a contest submission
// as any other. The run/submit pipeline itself never branches for
// contests; only this one extra step does. See
// CONTEST_SYSTEM_EXPLAINED.md §9 and §12.
//
// Ranking convention: total points descending, then penalty time
// ascending. Penalty time per solved problem = (minutes from contest
// start to the accepted submission) + (10 min per wrong submission before
// that AC). Unsolved problems contribute nothing — see §6 for why.

const WRONG_SUBMISSION_PENALTY_MINS = 10;

export interface RecordContestSubmissionParams {
  submissionId: number;
  userId: number;
  contestId: number;
  contestProblemId: number;
  isAccepted: boolean;
  submittedAt: Date;
}

export async function recordContestSubmission(params: RecordContestSubmissionParams) {
  const { submissionId, userId, contestId, contestProblemId, isAccepted, submittedAt } = params;

  const [contest, contestProblem, participant] = await Promise.all([
    prisma.contest.findUnique({ where: { id: contestId } }),
    prisma.contestProblem.findUnique({ where: { id: contestProblemId } }),
    prisma.contestParticipant.findUnique({ where: { contestId_userId: { contestId, userId } } }),
  ]);

  if (!contest || !contestProblem || !participant) {
    logger.error(
      `[contestSubmissionService] Missing contest/problem/participant for submission ${submissionId} — skipping contest bookkeeping.`,
    );
    return;
  }

  const submittedAtMins = Math.max(
    0,
    Math.round((submittedAt.getTime() - contest.startTime.getTime()) / 60000),
  );

  // First accept, contest-wide, for this problem — checked here so it's
  // race-safe against the DB rather than relying on the fast synchronous
  // check in submissionController.ts (that one's just for instant UI
  // feedback — this is the write that actually counts).
  const existingAccept = isAccepted
    ? await prisma.contestSubmission.findFirst({
        where: { contestId, contestProblemId, isFirstAccept: true },
      })
    : null;
  const isFirstAccept = isAccepted && !existingAccept;

  await prisma.contestSubmission.create({
    data: {
      contestId,
      contestProblemId,
      userId,
      submissionId,
      submittedAtMins,
      isAccepted,
      isFirstAccept,
    },
  });

  if (isFirstAccept) {
    await unlockFirstToSolve(userId, contestId);
  }

  if (isAccepted) {
    await applyAcceptedSolve({ contestId, contestProblemId, userId, submittedAtMins, points: contestProblem.points });
  } else {
    // A wrong submission still needs to be visible to the eventual
    // penalty calculation for this problem, once (if) it's solved —
    // handled by countWrongSubmissionsBefore() at solve time, so no
    // participant-row update happens here.
  }

  await recomputeRanksAndBroadcast(contestId);
}

async function applyAcceptedSolve(params: {
  contestId: number;
  contestProblemId: number;
  userId: number;
  submittedAtMins: number;
  points: number;
}) {
  const { contestId, contestProblemId, userId, submittedAtMins, points } = params;

  // Already solved this problem in this contest — later submit attempts
  // are practice against your own solve, not additional scoring.
  const alreadySolved = await prisma.contestSubmission.findFirst({
    where: { contestId, contestProblemId, userId, isAccepted: true, submittedAtMins: { lt: submittedAtMins } },
  });
  if (alreadySolved) return;

  const wrongBefore = await prisma.contestSubmission.count({
    where: { contestId, contestProblemId, userId, isAccepted: false },
  });
  const penaltyForThisProblem = submittedAtMins + wrongBefore * WRONG_SUBMISSION_PENALTY_MINS;

  await prisma.contestParticipant.update({
    where: { contestId_userId: { contestId, userId } },
    data: {
      solvedCount: { increment: 1 },
      totalPoints: { increment: points },
      penaltyMins: { increment: penaltyForThisProblem },
    },
  });
}

/**
 * Recomputes every participant's rank from current totals and broadcasts
 * the change to the contest's socket room — but only while the contest is
 * LIVE and not currently frozen. During the frozen window this function
 * still updates the underlying rank column (the true standings keep
 * computing live behind the scenes — only the leaderboard endpoint's
 * *display* is frozen, see contestController.ts), it just stops
 * broadcasting, since pushing a live delta to the room during a freeze
 * would leak exactly what freezing is meant to hide. See
 * CONTEST_SYSTEM_EXPLAINED.md §5 and §10.
 */
async function recomputeRanksAndBroadcast(contestId: number) {
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) return;

  const participants = await prisma.contestParticipant.findMany({
    where: { contestId },
    orderBy: [{ totalPoints: "desc" }, { penaltyMins: "asc" }],
  });

  await Promise.all(
    participants.map((p, i) =>
      prisma.contestParticipant.update({ where: { id: p.id }, data: { rank: i + 1 } }),
    ),
  );

  const isFrozen = contest.status === "LIVE" && contest.frozenStandings !== null;
  if (isFrozen) return;

  try {
    getIO()
      .to(`contest:${contestId}`)
      .emit("contest:leaderboard:update", {
        contestId,
        standings: participants.map((p, i) => ({
          userId: p.userId,
          rank: i + 1,
          solvedCount: p.solvedCount,
          penaltyMins: p.penaltyMins,
          totalPoints: p.totalPoints,
        })),
      });
  } catch (err) {
    // getIO() throws if socket.io hasn't initialized yet (e.g. in a
    // one-off script context) — bookkeeping itself already succeeded
    // above, so this is a broadcast miss, not a data-loss bug.
    logger.error("[contestSubmissionService] Failed to broadcast leaderboard update:", err);
  }
}
