import prisma from "../configs/db.js";
import { ContestType, Difficulty } from "@prisma/client";
import logger from "../configs/loggerConfig.js";

// ── Per-type contest envelope ──────────────────────────────────────────────
// Problem counts, duration, difficulty split, rating weight, and prize XP —
// all agreed in the contest-system design discussion.

export interface ContestEnvelope {
  problemCount: number;
  durationMinutes: number;
  difficultyMix: { easy: number; medium: number; hard: number };
  ratingWeight: number;
  prizeTop10Xp: number;
  prizeTop100Xp: number;
  pointMultiplier: number; // applied on top of the base per-difficulty points
}

export const CONTEST_ENVELOPES: Record<ContestType, ContestEnvelope> = {
  DAILY: {
    problemCount: 5,
    durationMinutes: 60,
    difficultyMix: { easy: 3, medium: 1, hard: 1 },
    ratingWeight: 0.25,
    prizeTop10Xp: 200,
    prizeTop100Xp: 50,
    pointMultiplier: 1.0,
  },
  WEEKLY: {
    problemCount: 10,
    durationMinutes: 90,
    difficultyMix: { easy: 4, medium: 4, hard: 2 },
    ratingWeight: 1.0,
    prizeTop10Xp: 1000,
    prizeTop100Xp: 250,
    pointMultiplier: 1.5,
  },
  BIWEEKLY: {
    problemCount: 15,
    durationMinutes: 120,
    difficultyMix: { easy: 5, medium: 6, hard: 4 },
    ratingWeight: 1.25,
    prizeTop10Xp: 2000,
    prizeTop100Xp: 500,
    pointMultiplier: 2.0,
  },
  MONTHLY: {
    problemCount: 20,
    durationMinutes: 210,
    difficultyMix: { easy: 6, medium: 8, hard: 6 },
    ratingWeight: 1.5,
    prizeTop10Xp: 5000,
    prizeTop100Xp: 1000,
    pointMultiplier: 3.0,
  },
};

const BASE_POINTS: Record<Difficulty, number> = {
  easy: 100,
  medium: 200,
  hard: 400,
};

function pointsFor(envelope: ContestEnvelope, difficulty: Difficulty): number {
  return Math.round(BASE_POINTS[difficulty] * envelope.pointMultiplier);
}

// A–Z, then AA/AB.../ for contests with more than 26 problems (Monthly
// tops out at 20, so this never actually needs the two-letter branch —
// kept in for headroom if envelopes change later).
function labelFor(index: number): string {
  if (index < 26) return String.fromCharCode(65 + index);
  return "A" + String.fromCharCode(65 + (index % 26));
}

interface EligibleProblem {
  id: number;
  difficulty: Difficulty;
  tags: string[];
  lastUsedAt: Date | null;
}

// Problems ordered oldest-used-first (never-used problems sort first,
// via lastUsedAt IS NULL). This directly implements the agreed fallback:
// if the strict "not used recently" pool runs dry, we still have a
// well-ordered list to keep pulling from — the least-stale option wins
// automatically rather than needing a separate fallback code path.
async function getEligibleProblemsByDifficulty(
  difficulty: Difficulty,
): Promise<EligibleProblem[]> {
  const problems = await prisma.problem.findMany({
    where: { difficulty },
    select: {
      id: true,
      difficulty: true,
      tags: true,
      contestProblems: {
        select: { contest: { select: { createdAt: true } } },
        orderBy: { contest: { createdAt: "desc" } },
        take: 1,
      },
    },
  });

  return problems
    .map((p) => ({
      id: p.id,
      difficulty: p.difficulty,
      tags: p.tags,
      lastUsedAt: p.contestProblems[0]?.contest.createdAt ?? null,
    }))
    .sort((a, b) => {
      if (a.lastUsedAt === null && b.lastUsedAt === null) return 0;
      if (a.lastUsedAt === null) return -1; // never-used sorts first
      if (b.lastUsedAt === null) return 1;
      return a.lastUsedAt.getTime() - b.lastUsedAt.getTime();
    });
}

// Rejects a candidate if it shares more than 1 tag with any problem
// already picked for this contest — keeps a contest from being "5
// Arrays problems" without needing a fixed topic taxonomy (tags are
// free-text String[] on Problem, not an enum).
function sharesTooManyTags(candidateTags: string[], pickedTagSets: string[][]): boolean {
  for (const pickedTags of pickedTagSets) {
    const overlap = candidateTags.filter((t) => pickedTags.includes(t)).length;
    if (overlap > 1) return true;
  }
  return false;
}

async function selectProblemsForContest(
  envelope: ContestEnvelope,
): Promise<{ problemId: number; difficulty: Difficulty }[]> {
  const buckets: { difficulty: Difficulty; count: number }[] = [
    { difficulty: "easy", count: envelope.difficultyMix.easy },
    { difficulty: "medium", count: envelope.difficultyMix.medium },
    { difficulty: "hard", count: envelope.difficultyMix.hard },
  ];

  const picked: { problemId: number; difficulty: Difficulty }[] = [];
  const pickedTagSets: string[][] = [];

  for (const bucket of buckets) {
    const candidates = await getEligibleProblemsByDifficulty(bucket.difficulty);
    let takenInBucket = 0;

    // Pass 1: respect the tag-diversity rule.
    for (const candidate of candidates) {
      if (takenInBucket >= bucket.count) break;
      if (sharesTooManyTags(candidate.tags, pickedTagSets)) continue;
      picked.push({ problemId: candidate.id, difficulty: candidate.difficulty });
      pickedTagSets.push(candidate.tags);
      takenInBucket++;
    }

    // Pass 2 (fallback): if the diversity rule left the bucket short —
    // a shallow problem bank at this difficulty — relax it and just
    // take the least-recently-used remaining problems, oldest first.
    if (takenInBucket < bucket.count) {
      const alreadyPickedIds = new Set(picked.map((p) => p.problemId));
      for (const candidate of candidates) {
        if (takenInBucket >= bucket.count) break;
        if (alreadyPickedIds.has(candidate.id)) continue;
        picked.push({ problemId: candidate.id, difficulty: candidate.difficulty });
        takenInBucket++;
      }
    }

    if (takenInBucket < bucket.count) {
      logger.warn(
        `[contestGenerator] Only found ${takenInBucket}/${bucket.count} ${bucket.difficulty} problems — problem bank is running shallow at this difficulty.`,
      );
    }
  }

  return picked;
}

export interface GenerateContestParams {
  type: ContestType;
  title: string;
  slug: string;
  startTime: Date;
  createdById: number; // system/admin user id that "owns" auto-generated contests
}

export async function generateContest(params: GenerateContestParams) {
  const envelope = CONTEST_ENVELOPES[params.type];
  const endTime = new Date(
    params.startTime.getTime() + envelope.durationMinutes * 60_000,
  );

  const selected = await selectProblemsForContest(envelope);

  const contest = await prisma.contest.create({
    data: {
      title: params.title,
      slug: params.slug,
      type: params.type,
      startTime: params.startTime,
      endTime,
      rated: true,
      ratingWeight: envelope.ratingWeight,
      status: "SCHEDULED",
      createdById: params.createdById,
    },
  });

  await prisma.$transaction(
    selected.map((s, index) =>
      prisma.contestProblem.create({
        data: {
          contestId: contest.id,
          problemId: s.problemId,
          label: labelFor(index),
          points: pointsFor(envelope, s.difficulty),
        },
      }),
    ),
  );

  // Hide the picked problems from /problems and search until the
  // contest ends (participants still reach them through the contest
  // workspace, which is gated separately). A nightly job flips them
  // back once hiddenUntil passes — see releaseContestProblemsJob in
  // contestWorker.ts.
  await prisma.problem.updateMany({
    where: { id: { in: selected.map((s) => s.problemId) } },
    data: { visibility: "CONTEST_ONLY", hiddenUntil: endTime },
  });

  logger.info(
    `[contestGenerator] Generated ${params.type} contest "${params.title}" (id=${contest.id}) with ${selected.length} problems.`,
  );

  return contest;
}
