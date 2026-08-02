import { Worker, Job } from "bullmq";
import { redisConnection } from "../configs/redisConfig.js";
import prisma from "../configs/db.js";
import logger from "../configs/loggerConfig.js";
import { getIO } from "../configs/socketConfig.js";
import { ContestLifecycleJobData } from "../queues/contestLifecycleQueue.js";
import { calculateContestRatings, RatingParticipantInput } from "../services/ratingCalculator.js";
import {
  checkPerContestAchievements,
  checkCrossContestAchievements,
  checkFastestSolver,
  checkUpsetWinner,
  checkComeback,
} from "../services/achievementService.js";

function safeEmit(room: string, event: string, payload: unknown) {
  try {
    getIO().to(room).emit(event, payload);
  } catch {
    logger.warn(`[contestLifecycleWorker] Socket.io unavailable — skipped emitting ${event}.`);
  }
}

async function handleStart(contestId: number) {
  await prisma.contest.update({ where: { id: contestId }, data: { status: "LIVE" } });
  safeEmit(`contest:${contestId}`, "contest:started", { contestId });
  logger.info(`[contestLifecycleWorker] Contest ${contestId} is now LIVE.`);
}

/** Recomputes every participant's rank fresh, from live standings, and returns them sorted. Shared by handleMidpoint and handleFreeze. */
async function computeFreshStandings(contestId: number) {
  const participants = await prisma.contestParticipant.findMany({
    where: { contestId },
    orderBy: [{ totalPoints: "desc" }, { penaltyMins: "asc" }],
    select: { userId: true, solvedCount: true, penaltyMins: true, totalPoints: true },
  });
  return participants.map((p, i) => ({ ...p, rank: i + 1 }));
}

/**
 * Fires at the contest's halfway point — takes a standings snapshot used
 * only to detect the "Comeback" achievement at settlement (see
 * checkComeback in achievementService.ts). Nothing user-visible happens
 * here; this is pure bookkeeping for later.
 */
async function handleMidpoint(contestId: number) {
  const standings = await computeFreshStandings(contestId);
  await prisma.contest.update({
    where: { id: contestId },
    data: { midpointStandings: standings.map((s) => ({ userId: s.userId, rank: s.rank })) },
  });
  logger.info(`[contestLifecycleWorker] Recorded midpoint standings for contest ${contestId} (${standings.length} participants).`);
}

/**
 * Fires 75% through the contest (last 25% frozen — see the
 * freeze-leaderboard design discussion; applies to all contest types).
 * Snapshots the full leaderboard and stores it on Contest.frozenStandings
 * — the leaderboard endpoint switches to serving this static snapshot
 * instead of live data while the contest is still LIVE. Submissions keep
 * being judged normally behind the scenes; only the *visible* standings
 * freeze. Automatically supersedes itself the moment settlement runs at
 * contest end, since getContestLeaderboard only consults this field
 * while status is still LIVE.
 */
async function handleFreeze(contestId: number) {
  const standings = await computeFreshStandings(contestId);
  await prisma.contest.update({
    where: { id: contestId },
    data: { frozenStandings: standings },
  });
  safeEmit(`contest:${contestId}`, "contest:frozen", { contestId });
  logger.info(`[contestLifecycleWorker] Froze leaderboard for contest ${contestId} (${standings.length} participants).`);
}

async function handleEnd(contestId: number) {
  const contest = await prisma.contest.update({
    where: { id: contestId },
    data: { status: "ENDED" },
  });
  safeEmit(`contest:${contestId}`, "contest:ended", { contestId });
  logger.info(`[contestLifecycleWorker] Contest ${contestId} has ENDED — settling ratings.`);

  const participants = await prisma.contestParticipant.findMany({
    where: { contestId, rank: { not: null } },
    include: { user: { select: { id: true, contestRating: true } } },
  });

  if (contest.rated && participants.length > 0) {
    // contestsPlayed = number of prior *rated, already-settled* contests
    // for each participant — used by the rating calculator to give new
    // players a larger K-factor so they converge faster.
    const contestsPlayedByUser = await prisma.ratingHistory.groupBy({
      by: ["userId"],
      where: { userId: { in: participants.map((p) => p.userId) } },
      _count: { _all: true },
    });
    const contestsPlayedMap = new Map(
      contestsPlayedByUser.map((c) => [c.userId, c._count._all]),
    );

    const ratingInputs: RatingParticipantInput[] = participants.map((p) => ({
      userId: p.userId,
      rating: p.user.contestRating,
      rank: p.rank as number,
      contestsPlayed: contestsPlayedMap.get(p.userId) ?? 0,
    }));

    const results = calculateContestRatings(ratingInputs, contest.ratingWeight);

    for (const result of results) {
      await prisma.$transaction([
        prisma.contestParticipant.update({
          where: { contestId_userId: { contestId, userId: result.userId } },
          data: {
            ratingBefore: result.ratingBefore,
            ratingAfter: result.ratingAfter,
            ratingDelta: result.delta,
          },
        }),
        prisma.ratingHistory.create({
          data: {
            userId: result.userId,
            contestId,
            rating: result.ratingAfter,
            delta: result.delta,
          },
        }),
        prisma.user.update({
          where: { id: result.userId },
          data: { contestRating: result.ratingAfter },
        }),
      ]);

      // peakRating is a running max — only ever raise it, never lower
      // it, via a conditional update rather than writing it unconditionally.
      await prisma.user.updateMany({
        where: { id: result.userId, peakRating: { lt: result.ratingAfter } },
        data: { peakRating: result.ratingAfter },
      });
    }

    safeEmit(`contest:${contestId}`, "contest:ratings:published", {
      contestId,
      results: results.map((r) => ({ userId: r.userId, delta: r.delta, ratingAfter: r.ratingAfter })),
    });

    // Achievements — per-contest checks need each participant's wrong
    // submission count, so pull it once per participant.
    const totalProblems = await prisma.contestProblem.count({ where: { contestId } });
    for (const p of participants) {
      const wrongSubmissionCount = await prisma.contestSubmission.count({
        where: { contestId, userId: p.userId, isFirstAccept: false },
      });
      await checkPerContestAchievements({
        contestId,
        userId: p.userId,
        rank: p.rank as number,
        totalParticipants: participants.length,
        solvedCount: p.solvedCount,
        totalProblems,
        wrongSubmissionCount,
      });
      await checkCrossContestAchievements(p.userId);
    }
    await checkFastestSolver(contestId);

    // Upset Winner needs each participant's pre-contest rating —
    // ratingInputs already has it (it's what was fed into the rating
    // calc above), just paired here with final rank.
    const ratingByUser = new Map(ratingInputs.map((r) => [r.userId, r.rating]));
    await checkUpsetWinner(
      participants.map((p) => ({
        userId: p.userId,
        rank: p.rank as number,
        ratingBefore: ratingByUser.get(p.userId) ?? p.user.contestRating,
      })),
    );

    await checkComeback(
      contestId,
      participants.map((p) => ({ userId: p.userId, rank: p.rank as number })),
    );
  }

  logger.info(`[contestLifecycleWorker] Contest ${contestId} settlement complete.`);
}

async function handleReleaseProblems(contestId: number) {
  const contestProblems = await prisma.contestProblem.findMany({
    where: { contestId },
    select: { problemId: true },
  });
  await prisma.problem.updateMany({
    where: {
      id: { in: contestProblems.map((cp) => cp.problemId) },
      hiddenUntil: { lte: new Date() },
    },
    data: { visibility: "PUBLIC", hiddenUntil: null },
  });
  logger.info(`[contestLifecycleWorker] Released ${contestProblems.length} problem(s) from contest ${contestId} back to the public bank.`);
}

const contestLifecycleWorker = new Worker<ContestLifecycleJobData>(
  "contest-lifecycle",
  async (job: Job<ContestLifecycleJobData>) => {
    switch (job.data.kind) {
      case "start":
        return handleStart(job.data.contestId);
      case "midpoint":
        return handleMidpoint(job.data.contestId);
      case "freeze":
        return handleFreeze(job.data.contestId);
      case "end":
        return handleEnd(job.data.contestId);
      case "release-problems":
        return handleReleaseProblems(job.data.contestId);
    }
  },
  { connection: redisConnection, concurrency: 3 },
);

contestLifecycleWorker.on("failed", (job, err) => {
  logger.error(`[contestLifecycleWorker] Job ${job?.id} (${job?.data?.kind}) failed: ${err.message}`);
});

export default contestLifecycleWorker;
