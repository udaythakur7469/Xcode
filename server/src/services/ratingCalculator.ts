// ── Contest rating calculator ──────────────────────────────────────────────
// A simplified, faithful-to-the-spirit version of the Codeforces rating
// algorithm ("seed" / Elo-MMR family). Runs once per contest, over every
// participant at once, right after the contest ends — see
// contestWorker.ts (settleContestJob).
//
// This is intentionally NOT per-submission — it's an O(n^2) batch job
// (every participant compared against every other participant), which is
// fine up to a few thousand participants. If the contest system ever
// regularly sees tens of thousands of simultaneous participants, this is
// the first place to optimize (sort + approximate seed via binary
// indexed tree instead of the full O(n^2) pairwise sum).

export interface RatingParticipantInput {
  userId: number;
  rating: number; // rating BEFORE this contest
  rank: number; // final contest rank (1 = first place); ties share a rank
  contestsPlayed: number; // how many *rated* contests this user has completed before this one
}

export interface RatingParticipantResult {
  userId: number;
  ratingBefore: number;
  ratingAfter: number;
  delta: number; // already rounded, already includes the contest-type weight
}

// New players' ratings should converge faster; established players should
// move more slowly. This mirrors Codeforces' informal "K-factor" behavior
// without trying to reproduce its exact volatility model.
function kFactorFor(contestsPlayed: number): number {
  if (contestsPlayed < 5) return 1.6;
  if (contestsPlayed < 20) return 1.0;
  return 0.7;
}

// Expected "seed" (expected finishing rank) for a player against the rest
// of the field, using the standard pairwise Elo win-probability sum.
// A lower seed is better (seed 1 = expected to win outright).
function computeSeed(
  ratingOfPlayer: number,
  allRatings: number[],
): number {
  let seed = 1;
  for (const otherRating of allRatings) {
    seed += 1 / (1 + Math.pow(10, (ratingOfPlayer - otherRating) / 400));
  }
  return seed;
}

// Binary-search for the rating R such that computeSeed(R, others) equals
// the target seed. computeSeed is monotonically decreasing in R, so
// binary search is safe.
function ratingForTargetSeed(
  targetSeed: number,
  othersRatings: number[],
  searchFrom = 100,
  searchTo = 4000,
): number {
  let lo = searchFrom;
  let hi = searchTo;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const seedAtMid = computeSeed(mid, othersRatings);
    if (seedAtMid < targetSeed) {
      // Too strong a rating for this seed (seed decreases as rating
      // increases) — the target rating must be lower.
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return (lo + hi) / 2;
}

/**
 * Computes rating deltas for every participant in a single contest.
 *
 * @param participants   Every rated participant, with their pre-contest
 *                        rating, final rank, and rated-contest history.
 * @param ratingWeight    Contest-type multiplier (Daily 0.25, Weekly 1.0,
 *                        Biweekly 1.25, Monthly 1.5 — see Contest.ratingWeight).
 */
export function calculateContestRatings(
  participants: RatingParticipantInput[],
  ratingWeight: number,
): RatingParticipantResult[] {
  if (participants.length === 0) return [];
  // A single participant has no field to be measured against — no
  // meaningful rating movement is possible.
  if (participants.length === 1) {
    const [p] = participants;
    return [
      {
        userId: p.userId,
        ratingBefore: p.rating,
        ratingAfter: p.rating,
        delta: 0,
      },
    ];
  }

  const allRatings = participants.map((p) => p.rating);

  const rawDeltas = participants.map((p) => {
    const othersRatings = participants
      .filter((o) => o.userId !== p.userId)
      .map((o) => o.rating);

    const seed = computeSeed(p.rating, othersRatings);
    // CF averages the pure-Elo expected rank with the player's actual
    // rank so a single outlier contest can't swing rating too violently.
    const targetSeed = Math.sqrt(seed * p.rank);
    const performanceRating = ratingForTargetSeed(targetSeed, othersRatings);

    const kFactor = kFactorFor(p.contestsPlayed);
    const rawDelta = ((performanceRating - p.rating) / 2) * kFactor;
    return { userId: p.userId, rating: p.rating, rawDelta };
  });

  // Zero-sum correction: without this, aggregate rating in the pool
  // drifts upward every contest (everyone can't gain on average). Shift
  // every delta by the field's mean so the total change nets to ~0.
  const meanDelta =
    rawDeltas.reduce((sum, d) => sum + d.rawDelta, 0) / rawDeltas.length;

  return rawDeltas.map((d) => {
    const corrected = d.rawDelta - meanDelta;
    const weighted = corrected * ratingWeight;
    const delta = Math.round(weighted);
    return {
      userId: d.userId,
      ratingBefore: d.rating,
      ratingAfter: Math.max(0, d.rating + delta),
      delta,
    };
  });
}
