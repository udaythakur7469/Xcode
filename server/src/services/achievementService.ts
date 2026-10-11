import prisma from "../configs/db.js";
import logger from "../configs/loggerConfig.js";

// ─── achievementService ──────────────────────────────────────────────────
//
// Achievements split into two kinds, purely by what data they need — see
// CONTEST_SYSTEM_EXPLAINED.md §8:
//
//   - Per-contest checks only need this one contest's already-in-memory
//     settlement data (final rank, solved count, wrong-submission count).
//   - Cross-contest checks need a user's full history (total contests
//     played, current streak).
//
// The one exception is "First to Solve", which is checked live, the
// instant a submission comes in — see contestSubmissionService.ts — since
// it's cheap and worth surfacing immediately rather than waiting for
// settlement.

export const ACHIEVEMENT_CATALOG = [
  { key: "FIRST_TO_SOLVE", name: "First to Solve", description: "Be the first to solve a problem in a contest.", icon: "🥇", category: "contest" },
  { key: "NO_WRONG_SUBMISSION", name: "Clean Sheet", description: "Finish a contest with zero wrong submissions.", icon: "🎯", category: "contest" },
  { key: "PERFECT_SCORE", name: "Perfect Score", description: "Solve every problem in a contest.", icon: "💯", category: "contest" },
  { key: "TOP_10", name: "Podium Contender", description: "Finish in the top 10 of a contest.", icon: "🏆", category: "contest" },
  { key: "TOP_100", name: "Top 100", description: "Finish in the top 100 of a contest.", icon: "📈", category: "contest" },
  { key: "COMEBACK", name: "Comeback", description: "Finish far higher than where you sat at the midpoint.", icon: "😤", category: "contest" },
  { key: "UPSET_WINNER", name: "Upset Winner", description: "Beat a field where you were a significant underdog.", icon: "⚡", category: "contest" },
  { key: "FIVE_STREAK", name: "5-Streak", description: "Play 5 contests of the same type in a row, no gaps.", icon: "🔥", category: "streak" },
  { key: "TWENTYFIVE_CONTESTS", name: "25 Contests", description: "Play 25 contests.", icon: "🗓️", category: "milestone" },
  { key: "REACHED_EXPERT", name: "Reached Expert", description: "Reach a contest rating of 1650.", icon: "🔷", category: "rating" },
  { key: "REACHED_MASTER", name: "Reached Master", description: "Reach a contest rating of 1900.", icon: "🟣", category: "rating" },
] as const;

export type AchievementKey = (typeof ACHIEVEMENT_CATALOG)[number]["key"];

/**
 * Upserts every entry in ACHIEVEMENT_CATALOG into the Achievement table.
 * Called once at server startup (see app.ts) — idempotent via upsert, so
 * it's safe to run on every boot/restart, and safe to add a new catalog
 * entry and just redeploy, no manual seed step. Consistent with "no admin
 * in this system" — nothing here waits on a human to run a script.
 */
export async function ensureAchievementCatalogSeeded() {
  for (const a of ACHIEVEMENT_CATALOG) {
    await prisma.achievement.upsert({
      where: { key: a.key },
      update: { name: a.name, description: a.description, icon: a.icon, category: a.category },
      create: { key: a.key, name: a.name, description: a.description, icon: a.icon, category: a.category },
    });
  }
  logger.info(`[achievementService] Achievement catalog seeded (${ACHIEVEMENT_CATALOG.length} entries).`);
}

/** Unlocks an achievement for a user, if they don't already have it. Silent no-op on a duplicate — @@unique([userId, achievementId]) is the actual guard. */
export async function unlock(userId: number, key: AchievementKey, contestId?: number) {
  const achievement = await prisma.achievement.findUnique({ where: { key } });
  if (!achievement) {
    logger.error(`[achievementService] Unknown achievement key "${key}" — did you forget to seed it?`);
    return;
  }
  await prisma.userAchievement
    .create({ data: { userId, achievementId: achievement.id, contestId } })
    .catch(() => {
      // Already unlocked — expected, not an error.
    });
}

/** Live check, called from contestSubmissionService.ts the instant an accepted submission comes in — see the file header for why this one doesn't wait for settlement. */
export async function unlockFirstToSolve(userId: number, contestId: number) {
  await unlock(userId, "FIRST_TO_SOLVE", contestId);
}

/**
 * Per-contest checks — run once per participant at settlement, from
 * data already gathered for that contest (rank, solved count, wrong
 * submissions). Called by contestLifecycleWorker.ts's handleEnd.
 */
export async function checkPerContestAchievements(params: {
  userId: number;
  contestId: number;
  rank: number;
  solvedCount: number;
  totalProblems: number;
  wrongSubmissionCount: number;
}) {
  const { userId, contestId, rank, solvedCount, totalProblems, wrongSubmissionCount } = params;

  if (wrongSubmissionCount === 0 && solvedCount > 0) {
    await unlock(userId, "NO_WRONG_SUBMISSION", contestId);
  }
  if (solvedCount === totalProblems && totalProblems > 0) {
    await unlock(userId, "PERFECT_SCORE", contestId);
  }
  if (rank <= 10) {
    await unlock(userId, "TOP_10", contestId);
  }
  if (rank <= 100) {
    await unlock(userId, "TOP_100", contestId);
  }
}

/**
 * Cross-contest checks — need the user's full history, so they query
 * across every ContestParticipant row rather than just this contest's
 * in-memory data. Still cheap enough to run once per participant at
 * settlement, same as the per-contest checks.
 */
export async function checkCrossContestAchievements(userId: number) {
  const totalPlayed = await prisma.contestParticipant.count({ where: { userId } });
  if (totalPlayed >= 25) {
    await unlock(userId, "TWENTYFIVE_CONTESTS");
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { contestRating: true } });
  if (user) {
    if (user.contestRating >= 1650) await unlock(userId, "REACHED_EXPERT");
    if (user.contestRating >= 1900) await unlock(userId, "REACHED_MASTER");
  }

  await checkStreak(userId);
}

async function checkStreak(userId: number) {
  const recent = await prisma.contestParticipant.findMany({
    where: { userId },
    orderBy: { contest: { startTime: "desc" } },
    take: 5,
    select: { contest: { select: { type: true, startTime: true } } },
  });
  if (recent.length < 5) return;

  const sameType = recent.every((r) => r.contest.type === recent[0].contest.type);
  if (sameType) {
    await unlock(userId, "FIVE_STREAK");
  }
}

/** Checked once per contest at settlement, across every participant — not per-user, since it needs to find whoever solved a given problem fastest contest-wide. Currently a placeholder for a future "Speed Demon" style badge; wired here so contestLifecycleWorker.ts has a single, stable call site to extend later. */
export async function checkFastestSolver(contestId: number) {
  // Intentionally a no-op for now — no FASTEST_SOLVER entry exists yet in
  // ACHIEVEMENT_CATALOG. Left as an explicit call site (rather than
  // omitted) so adding that badge later is a change to this function
  // only, not a hunt through contestLifecycleWorker.ts.
  void contestId;
}

/** Needs the pre-contest rating gap between the winner and the field average — an "upset" only means something relative to how big an underdog they were. */
export async function checkUpsetWinner(
  contestId: number,
  winnerUserId: number,
  winnerRatingBefore: number,
  fieldAverageRating: number,
) {
  const UPSET_THRESHOLD = 150; // rating points below the field average
  if (fieldAverageRating - winnerRatingBefore >= UPSET_THRESHOLD) {
    await unlock(winnerUserId, "UPSET_WINNER", contestId);
  }
}

/** Compares final rank against the midpoint snapshot — a large enough climb counts as a comeback. */
export async function checkComeback(
  contestId: number,
  userId: number,
  midpointRank: number | undefined,
  finalRank: number,
  fieldSize: number,
) {
  if (midpointRank === undefined) return;
  const COMEBACK_THRESHOLD = Math.max(20, Math.round(fieldSize * 0.2));
  if (midpointRank - finalRank >= COMEBACK_THRESHOLD) {
    await unlock(userId, "COMEBACK", contestId);
  }
}
