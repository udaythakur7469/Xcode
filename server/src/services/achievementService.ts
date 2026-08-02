import prisma from "../configs/db.js";
import logger from "../configs/loggerConfig.js";

// Static catalog from the contest-system brainstorm doc. Seed these rows
// once via `npm run seed:achievements` (see scripts/seedAchievements.ts) —
// this array is also the single source of truth the unlock checks below
// key off of via `key`.
export const ACHIEVEMENT_CATALOG = [
  { key: "top100", name: "Top 100 Finisher", description: "Finish in the top 100 of a contest.", icon: "🏅", category: "Performance" },
  { key: "top10", name: "Top 10 Finisher", description: "Finish in the top 10 of a contest.", icon: "🥈", category: "Performance" },
  { key: "winner", name: "Contest Winner", description: "Finish 1st in a contest.", icon: "🏆", category: "Performance" },
  { key: "perfect", name: "Perfect Score", description: "Solve every problem in a contest.", icon: "💯", category: "Performance" },
  { key: "no_wrong_submission", name: "No Wrong Submission", description: "Solve every problem you attempted on the first try.", icon: "🎯", category: "Performance" },
  { key: "comeback", name: "Comeback", description: "Finish in the top 10% of the field after being outside it at the halfway mark.", icon: "🔁", category: "Performance" },
  { key: "upset", name: "Upset Winner", description: "Finish ahead of at least 3 competitors each rated 300+ points higher.", icon: "😤", category: "Performance" },
  { key: "fastest_a", name: "Fastest Solver", description: "Post the fastest accepted solution to the first problem in a contest.", icon: "⚡", category: "Speed" },
  { key: "first_to_solve", name: "First to Solve", description: "Be the first participant to solve a problem in a contest.", icon: "🥇", category: "Speed" },
  { key: "streak_5", name: "5-Contest Streak", description: "Participate in 5 consecutive contests of the same type.", icon: "🔥", category: "Participation" },
  { key: "streak_10", name: "10-Contest Streak", description: "Participate in 10 consecutive contests of the same type.", icon: "🔥", category: "Participation" },
  { key: "participation_5", name: "5 Contests", description: "Participate in 5 contests.", icon: "📈", category: "Participation" },
  { key: "participation_25", name: "25 Contests", description: "Participate in 25 contests.", icon: "📈", category: "Participation" },
  { key: "marathon_50", name: "Marathon", description: "Participate in 50 contests.", icon: "🏃", category: "Participation" },
  { key: "veteran_100", name: "Veteran", description: "Participate in 100 contests.", icon: "🎖", category: "Participation" },
  { key: "reached_titan", name: "Reached Titan", description: "Reach a contest rating of 2000 or higher.", icon: "⛰", category: "Rating" },
  { key: "reached_apex", name: "Reached Apex", description: "Reach a contest rating of 2200 or higher.", icon: "▲", category: "Rating" },
  { key: "reached_infinity", name: "Reached Infinity", description: "Reach a contest rating of 2400 or higher.", icon: "∞", category: "Rating" },
  { key: "reached_x", name: "Reached X", description: "Reach a contest rating of 2600 or higher.", icon: "✕", category: "Rating" },
] as const;

export async function unlock(userId: number, key: string, contestId?: number) {
  const achievement = await prisma.achievement.findUnique({ where: { key } });
  if (!achievement) {
    logger.warn(`[achievementService] Unknown achievement key "${key}" — did you run the seed script?`);
    return;
  }
  await prisma.userAchievement.upsert({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
    update: {}, // already unlocked — no-op, upsert just avoids a duplicate-key error
    create: { userId, achievementId: achievement.id, contestId },
  });
}

/**
 * Runs once per participant, right after the rating job settles a
 * contest. Cheap, single-contest-scoped checks only — the
 * participation/streak/rating-tier checks that need cross-contest
 * history are handled by checkCrossContestAchievements below.
 */
export async function checkPerContestAchievements(params: {
  contestId: number;
  userId: number;
  rank: number;
  totalParticipants: number;
  solvedCount: number;
  totalProblems: number;
  wrongSubmissionCount: number;
}) {
  const { contestId, userId, rank, totalParticipants, solvedCount, totalProblems, wrongSubmissionCount } = params;

  if (rank === 1) await unlock(userId, "winner", contestId);
  if (rank <= 10) await unlock(userId, "top10", contestId);
  if (rank <= 100) await unlock(userId, "top100", contestId);
  if (solvedCount === totalProblems && totalProblems > 0) await unlock(userId, "perfect", contestId);
  if (solvedCount > 0 && wrongSubmissionCount === 0) await unlock(userId, "no_wrong_submission", contestId);
}

/** Cross-contest checks: participation counts, streaks, rating tiers. */
export async function checkCrossContestAchievements(userId: number) {
  const [participationCount, user] = await Promise.all([
    prisma.contestParticipant.count({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { contestRating: true } }),
  ]);

  if (participationCount >= 5) await unlock(userId, "participation_5");
  if (participationCount >= 25) await unlock(userId, "participation_25");
  if (participationCount >= 50) await unlock(userId, "marathon_50");
  if (participationCount >= 100) await unlock(userId, "veteran_100");

  const rating = user?.contestRating ?? 1200;
  if (rating >= 2000) await unlock(userId, "reached_titan");
  if (rating >= 2200) await unlock(userId, "reached_apex");
  if (rating >= 2400) await unlock(userId, "reached_infinity");
  if (rating >= 2600) await unlock(userId, "reached_x");

  // Streak: consecutive contests of the same type with no gap. Cheap
  // enough to compute on the fly rather than maintaining a counter field.
  const recentByType = await prisma.contestParticipant.findMany({
    where: { userId },
    orderBy: { registeredAt: "desc" },
    take: 20,
    select: { contest: { select: { type: true, startTime: true } } },
  });
  const typeCounts = new Map<string, number>();
  for (const p of recentByType) {
    typeCounts.set(p.contest.type, (typeCounts.get(p.contest.type) ?? 0) + 1);
  }
  for (const [, count] of typeCounts) {
    if (count >= 5) await unlock(userId, "streak_5");
    if (count >= 10) await unlock(userId, "streak_10");
  }
}

export async function unlockFirstToSolve(userId: number, contestId: number) {
  await unlock(userId, "first_to_solve", contestId);
}

/**
 * "Fastest Solver" — awarded once per contest, to whoever posted the
 * fastest accepted submission on the contest's first problem (label "A").
 * Run once from the settlement job, after the contest ends.
 */
export async function checkFastestSolver(contestId: number) {
  const firstProblem = await prisma.contestProblem.findFirst({
    where: { contestId, label: "A" },
  });
  if (!firstProblem) return;

  const fastest = await prisma.contestSubmission.findFirst({
    where: { contestId, contestProblemId: firstProblem.id, isFirstAccept: true },
    orderBy: { submittedAtMins: "asc" },
  });
  if (fastest) await unlock(fastest.userId, "fastest_a", contestId);
}

const UPSET_RATING_GAP = 300;
const UPSET_MIN_BEATEN = 3;

/**
 * "Upset Winner" — automatic, no admin involved: a participant unlocks
 * this if their final rank beat at least UPSET_MIN_BEATEN other
 * participants who were each rated UPSET_RATING_GAP points higher (using
 * pre-contest rating, i.e. the same `rating` fed into the batch rating
 * calc — see ratingCalculator.ts). Both numbers are deliberately explicit
 * constants here rather than buried in the loop, since they're the kind
 * of thing you'll want to tune after watching real contests play out.
 *
 * Run once per contest from the settlement job, after ratings are
 * calculated (needs every participant's rank + pre-contest rating).
 */
export async function checkUpsetWinner(
  participants: { userId: number; rank: number; ratingBefore: number }[],
) {
  for (const p of participants) {
    const beatenHigherRated = participants.filter(
      (o) => o.userId !== p.userId && o.ratingBefore >= p.ratingBefore + UPSET_RATING_GAP && o.rank > p.rank,
    );
    if (beatenHigherRated.length >= UPSET_MIN_BEATEN) {
      await unlock(p.userId, "upset");
    }
  }
}

/**
 * "Comeback" — automatic: compares each participant's rank at the
 * contest's halfway mark (see Contest.midpointStandings, written by
 * contestLifecycleWorker.ts's handleMidpoint) to their final rank.
 * "Top 10%" is relative to field size at each point in time — a fixed
 * "top 100" wouldn't mean much for a Daily contest with 40 participants.
 * A participant who registered after the midpoint has no snapshot entry
 * and is skipped — they weren't in a position to "come back" from,
 * since they weren't in the contest yet.
 */
export async function checkComeback(
  contestId: number,
  finalStandings: { userId: number; rank: number }[],
) {
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: { midpointStandings: true },
  });
  const midpoint = contest?.midpointStandings as { userId: number; rank: number }[] | null;
  if (!midpoint || midpoint.length === 0) return;

  const midpointTopThreshold = Math.max(1, Math.ceil(midpoint.length * 0.1));
  const finalTopThreshold = Math.max(1, Math.ceil(finalStandings.length * 0.1));

  const midpointByUser = new Map(midpoint.map((m) => [m.userId, m.rank]));

  for (const p of finalStandings) {
    const midpointRank = midpointByUser.get(p.userId);
    if (midpointRank == null) continue; // registered after midpoint — no snapshot to compare against

    const wasOutsideTopAtMidpoint = midpointRank > midpointTopThreshold;
    const finishedInsideTopAtEnd = p.rank <= finalTopThreshold;
    if (wasOutsideTopAtMidpoint && finishedInsideTopAtEnd) {
      await unlock(p.userId, "comeback", contestId);
    }
  }
}
