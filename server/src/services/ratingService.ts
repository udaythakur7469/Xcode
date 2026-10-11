// ─── ratingService ───────────────────────────────────────────────────────
//
// Turns a contest's final standings into a rating delta for every rated
// participant. This is deliberately a pure, side-effect-free module — it
// takes plain data in, returns plain deltas out, and never touches prisma.
// That's on purpose: a rating bug is uniquely painful to walk back once
// real users' numbers have moved, so this is the one piece of the contest
// system meant to be testable against synthetic data in isolation before
// contestLifecycleWorker.ts ever calls it for real. See
// CONTEST_SYSTEM_EXPLAINED.md §7 for the full reasoning behind each of the
// four refinements below.

export interface RatingParticipant {
  userId: number;
  rating: number; // pre-contest rating
  rank: number; // final rank in this contest (1 = first place)
  contestsPlayed: number; // how many *rated* contests they've played before this one
}

export interface RatingResult {
  userId: number;
  ratingBefore: number;
  ratingAfter: number;
  delta: number;
}

const ELO_SCALE = 400; // standard Elo convention — see §7's expected() formula
const MAX_DELTA = 150; // rank-clamping — a single contest can't swing more than this
const NEW_PLAYER_K = 40; // high K while a rating hasn't converged yet
const VETERAN_K = 20; // low K once it has
const K_DECAY_CONTESTS = 10; // linearly interpolate from NEW_PLAYER_K to VETERAN_K over this many contests
const DRIFT_CORRECTION = 2; // small downward nudge — keeps the population average from creeping up forever

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / ELO_SCALE));
}

function kFactorFor(contestsPlayed: number): number {
  if (contestsPlayed >= K_DECAY_CONTESTS) return VETERAN_K;
  const t = contestsPlayed / K_DECAY_CONTESTS;
  return NEW_PLAYER_K - t * (NEW_PLAYER_K - VETERAN_K);
}

/**
 * Computes a rating delta for every participant, using every possible
 * pairwise comparison in the field — not just adjacent ranks. For each
 * pair, expectedScore() says how often the higher-rated side "should" win;
 * comparing that to whether they actually placed above the other side
 * gives a per-pair over/underperformance signal, summed across the whole
 * field. See CONTEST_SYSTEM_EXPLAINED.md §7 for the full intuition.
 */
export function computeRatingDeltas(
  participants: RatingParticipant[],
  ratingWeight: number,
): RatingResult[] {
  const n = participants.length;
  if (n < 2) {
    // A field of 0 or 1 rated participants has no pairwise comparisons
    // to draw from — nobody's rating moves.
    return participants.map((p) => ({
      userId: p.userId,
      ratingBefore: p.rating,
      ratingAfter: p.rating,
      delta: 0,
    }));
  }

  const results: RatingResult[] = [];

  for (const p of participants) {
    let performanceSum = 0;

    for (const opponent of participants) {
      if (opponent.userId === p.userId) continue;
      const expected = expectedScore(p.rating, opponent.rating);
      // Lower rank number = better placement. A tie splits the point.
      const actual =
        p.rank < opponent.rank ? 1 : p.rank > opponent.rank ? 0 : 0.5;
      performanceSum += actual - expected;
    }

    // Average over/underperformance across the whole field, not the sum —
    // otherwise a bigger contest would mechanically produce bigger deltas
    // for the same relative performance.
    const avgPerformance = performanceSum / (n - 1);

    const k = kFactorFor(p.contestsPlayed);
    let rawDelta = avgPerformance * k * ratingWeight;

    // Rank clamping — protects against a single outlier result
    // (an unusually thin field, a scoring edge case) swinging a rating
    // implausibly far in one contest.
    rawDelta = Math.max(-MAX_DELTA, Math.min(MAX_DELTA, rawDelta));

    // Downward drift correction — every new participant joins at the
    // default rating, which otherwise nudges the population average up
    // forever as existing players slowly "absorb" points from newcomers
    // calibrating. This is a small compensating adjustment, applied to
    // everyone, not a different algorithm.
    const delta = Math.round(rawDelta - DRIFT_CORRECTION);

    results.push({
      userId: p.userId,
      ratingBefore: p.rating,
      ratingAfter: p.rating + delta,
      delta,
    });
  }

  return results;
}
