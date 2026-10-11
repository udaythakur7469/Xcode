import { Prisma } from "@prisma/client";
import { Worker, Job } from "bullmq";
import { redisConnection } from "../configs/redisConfig.js";
import prisma from "../configs/db.js";
import { getIO } from "../configs/socketConfig.js";
import { ContestLifecycleJobData } from "../queues/contestLifecycleQueue.js";
import { computeRatingDeltas, RatingParticipant } from "../services/ratingService.js";
import {
  checkPerContestAchievements,
  checkCrossContestAchievements,
  checkFastestSolver,
  checkUpsetWinner,
  checkComeback,
} from "../services/achievementService.js";
import logger from "../configs/loggerConfig.js";

// ─── contestLifecycleWorker ──────────────────────────────────────────────
//
// One job per (contest, stage) — see contestLifecycleQueue.ts. Handles the
// state machine (scheduled → live → ended) plus the midpoint/freeze
// snapshots and full settlement at the end. See
// CONTEST_SYSTEM_EXPLAINED.md §5 for the full reasoning behind each stage.

interface StandingRow {
  userId: number;
  rank: number;
  solvedCount: number;
  penaltyMins: number;
  totalPoints: number;
  solvedProblems?: { label: string; submittedAtMins: number }[];
}

/**
 * Recomputes every participant's rank fresh, from live standings.
 * `includeSolvedProblems` additionally attaches each participant's
 * per-problem solved breakdown — only needed for the freeze snapshot,
 * since that's the one place this has to be captured at a point in time
 * rather than queried live (querying live post-freeze would leak solves
 * made after the freeze point).
 */
async function computeFreshStandings(contestId: number, includeSolvedProblems = false): Promise<StandingRow[]> {
  const participants = await prisma.contestParticipant.findMany({
    where: { contestId },
    orderBy: [{ totalPoints: "desc" }, { penaltyMins: "asc" }],
    select: { userId: true, solvedCount: true, penaltyMins: true, totalPoints: true },
  });
  const ranked: StandingRow[] = participants.map((p, i) => ({ ...p, rank: i + 1 }));

  if (!includeSolvedProblems) return ranked;

  const accepts = await prisma.contestSubmission.findMany({
    where: { contestId, isFirstAccept: true },
    select: { userId: true, submittedAtMins: true, contestProblem: { select: { label: true } } },
  });
  const solvedByUser = new Map<number, { label: string; submittedAtMins: number }[]>();
  for (const a of accepts) {
    const list = solvedByUser.get(a.userId) ?? [];
    list.push({ label: a.contestProblem.label, submittedAtMins: a.submittedAtMins });
    solvedByUser.set(a.userId, list);
  }

  return ranked.map((p) => ({ ...p, solvedProblems: solvedByUser.get(p.userId) ?? [] }));
}

async function handleStart(contestId: number) {
  await prisma.contest.update({ where: { id: contestId }, data: { status: "LIVE" } });
  logger.info(`[contestLifecycleWorker] Contest ${contestId} is now LIVE.`);
}

function toStandingSnapshot(standings: StandingRow[]): Prisma.InputJsonValue {
  return standings as unknown as Prisma.InputJsonValue;
}

async function handleMidpoint(contestId: number) {
  const standings = await computeFreshStandings(contestId);
  await prisma.contest.update({ where: { id: contestId }, data: { midpointStandings: toStandingSnapshot(standings) } });
}

async function handleFreeze(contestId: number) {
  const standings = await computeFreshStandings(contestId, true);
  await prisma.contest.update({ where: { id: contestId }, data: { frozenStandings: toStandingSnapshot(standings) } });
  logger.info(`[contestLifecycleWorker] Contest ${contestId} standings frozen.`);
}

async function handleEnd(contestId: number) {
  const contest = await prisma.contest.findUnique({ where: { id: contestId }, include: { problems: true } });
  if (!contest) return;

  // Unfreeze — the true, final standings replace whatever was frozen.
  await prisma.contest.update({ where: { id: contestId }, data: { status: "ENDED", frozenStandings: null } });

  const finalStandings = await computeFreshStandings(contestId);
  const participants = await prisma.contestParticipant.findMany({
    where: { contestId },
    include: { user: { select: { id: true, contestRating: true, peakRating: true } } },
  });

  // ── Rating (only for rated contests) ────────────────────────────────
  if (contest.rated) {
    const ratingInputs: RatingParticipant[] = await Promise.all(
      participants.map(async (p) => {
        const contestsPlayed = await prisma.ratingHistory.count({ where: { userId: p.userId } });
        return {
          userId: p.userId,
          rating: p.user.contestRating,
          rank: finalStandings.find((s) => s.userId === p.userId)?.rank ?? participants.length,
          contestsPlayed,
        };
      }),
    );
    const deltas = computeRatingDeltas(ratingInputs, contest.ratingWeight);

    for (const d of deltas) {
      await prisma.$transaction([
        prisma.contestParticipant.update({
          where: { contestId_userId: { contestId, userId: d.userId } },
          data: { ratingBefore: d.ratingBefore, ratingAfter: d.ratingAfter, ratingDelta: d.delta },
        }),
        prisma.ratingHistory.create({
          data: { userId: d.userId, contestId, rating: d.ratingAfter, delta: d.delta },
        }),
        prisma.user.update({
          where: { id: d.userId },
          data: { contestRating: d.ratingAfter },
        }),
      ]);
      const user = participants.find((p) => p.userId === d.userId)?.user;
      if (user && d.ratingAfter > user.peakRating) {
        await prisma.user.update({ where: { id: d.userId }, data: { peakRating: d.ratingAfter } });
      }
    }

    // Upset Winner needs the field's average pre-contest rating —
    // computed once, after every rating is known, not per-participant.
    const fieldAverage = ratingInputs.reduce((sum, r) => sum + r.rating, 0) / ratingInputs.length;
    const winner = finalStandings.find((s) => s.rank === 1);
    if (winner) {
      const winnerRating = ratingInputs.find((r) => r.userId === winner.userId)?.rating;
      if (winnerRating !== undefined) {
        await checkUpsetWinner(contestId, winner.userId, winnerRating, fieldAverage);
      }
    }
  }

  // ── Achievements ─────────────────────────────────────────────────────
  const midpointStandings = (contest.midpointStandings as unknown as StandingRow[] | null) ?? [];
  for (const p of participants) {
    const final = finalStandings.find((s) => s.userId === p.userId);
    if (!final) continue;

    const wrongSubmissionCount = await prisma.contestSubmission.count({
      where: { contestId, userId: p.userId, isAccepted: false },
    });

    await checkPerContestAchievements({
      userId: p.userId,
      contestId,
      rank: final.rank,
      solvedCount: final.solvedCount,
      totalProblems: contest.problems.length,
      wrongSubmissionCount,
    });

    const midpointRank = midpointStandings.find((s) => s.userId === p.userId)?.rank;
    await checkComeback(contestId, p.userId, midpointRank, final.rank, participants.length);

    await checkCrossContestAchievements(p.userId);
  }
  await checkFastestSolver(contestId);

  // ── Unhide problems pulled from the public bank for this contest ────
  const problemIds = contest.problems.map((cp) => cp.problemId);
  await prisma.problem.updateMany({
    where: { id: { in: problemIds } },
    data: { visibility: "PUBLIC", hiddenUntil: null },
  });

  try {
    getIO().to(`contest:${contestId}`).emit("contest:ended", { contestId });
  } catch (err) {
    logger.error("[contestLifecycleWorker] Failed to broadcast contest:ended:", err);
  }

  logger.info(`[contestLifecycleWorker] Contest ${contestId} settled — ${participants.length} participants.`);
}

const contestLifecycleWorker = new Worker<ContestLifecycleJobData>(
  "contest-lifecycle",
  async (job: Job<ContestLifecycleJobData>) => {
    const { contestId, stage } = job.data;
    switch (stage) {
      case "start":
        return handleStart(contestId);
      case "midpoint":
        return handleMidpoint(contestId);
      case "freeze":
        return handleFreeze(contestId);
      case "end":
        return handleEnd(contestId);
    }
  },
  { connection: redisConnection, concurrency: 3 },
);

contestLifecycleWorker.on("failed", (job, err) => {
  logger.error(`[contestLifecycleWorker] Job ${job?.id} (${job?.data?.stage}) failed: ${err.message}`);
});

export default contestLifecycleWorker;
