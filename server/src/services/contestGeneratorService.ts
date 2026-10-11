import prisma from "../configs/db.js";
import { ContestType } from "@prisma/client";

// ─── contestGeneratorService ─────────────────────────────────────────────
//
// Fully automated — no admin in this system, no manual curation step.
// contestSchedulerWorker.ts calls generateContest() on a fixed cadence per
// type; this is the part that actually decides which problems go in and
// creates the rows. See CONTEST_SYSTEM_EXPLAINED.md §4.

// { easy, medium, hard } problem counts and total duration per contest type.
const CONTEST_ENVELOPES: Record<
  ContestType,
  { easy: number; medium: number; hard: number; durationMins: number; ratingWeight: number }
> = {
  DAILY: { easy: 3, medium: 2, hard: 0, durationMins: 45, ratingWeight: 0.4 },
  WEEKLY: { easy: 3, medium: 4, hard: 2, durationMins: 90, ratingWeight: 1.0 },
  BIWEEKLY: { easy: 4, medium: 6, hard: 3, durationMins: 120, ratingWeight: 1.2 },
  MONTHLY: { easy: 5, medium: 8, hard: 4, durationMins: 180, ratingWeight: 1.5 },
};

const POINTS_BY_DIFFICULTY = { easy: 100, medium: 300, hard: 600 } as const;
const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export interface GenerateContestParams {
  type: ContestType;
  title: string;
  slug: string;
  startTime: Date;
}

export async function generateContest(params: GenerateContestParams) {
  const envelope = CONTEST_ENVELOPES[params.type];
  const endTime = new Date(params.startTime.getTime() + envelope.durationMins * 60000);

  const problems = await pickProblems(envelope);

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
    },
  });

  await prisma.contestProblem.createMany({
    data: problems.map((p, i) => ({
      contestId: contest.id,
      problemId: p.id,
      label: LABELS[i],
      points: POINTS_BY_DIFFICULTY[p.difficulty as "easy" | "medium" | "hard"],
    })),
  });

  // Hide every pulled problem from the public bank for the contest's
  // duration — see the ProblemVisibility note on the Problem model.
  await prisma.problem.updateMany({
    where: { id: { in: problems.map((p) => p.id) } },
    data: { visibility: "CONTEST_ONLY", hiddenUntil: endTime },
  });

  return contest;
}

/**
 * Picks problems by difficulty distribution, avoiding anything used in a
 * contest within the last 30 days (recency) and preferring tag diversity
 * within each difficulty bucket. Only pulls from problems currently
 * PUBLIC, so a problem already locked into another upcoming contest can't
 * double-book.
 */
async function pickProblems(envelope: { easy: number; medium: number; hard: number }) {
  const recentCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentlyUsedIds = await prisma.contestProblem
    .findMany({
      where: { contest: { startTime: { gte: recentCutoff } } },
      select: { problemId: true },
    })
    .then((rows) => rows.map((r) => r.problemId));

  const picked: { id: number; difficulty: string; tags: string[] }[] = [];

  for (const [difficulty, count] of Object.entries(envelope) as [string, number][]) {
    if (count === 0) continue;
    const candidates = await prisma.problem.findMany({
      where: {
        difficulty: difficulty as "easy" | "medium" | "hard",
        visibility: "PUBLIC",
        id: { notIn: [...recentlyUsedIds, ...picked.map((p) => p.id)] },
      },
      select: { id: true, difficulty: true, tags: true },
    });

    // Greedy tag-diversity pick: at each step, prefer whichever candidate
    // shares the fewest tags with what's already been picked for this
    // contest, so the same handful of topics don't dominate a single
    // contest's difficulty bucket.
    const bucket: typeof candidates = [];
    const usedTags = new Set<string>();
    const pool = [...candidates];
    while (bucket.length < count && pool.length > 0) {
      pool.sort((a, b) => overlapScore(a.tags, usedTags) - overlapScore(b.tags, usedTags));
      const next = pool.shift()!;
      bucket.push(next);
      next.tags.forEach((t) => usedTags.add(t));
    }
    picked.push(...bucket);
  }

  return picked;
}

function overlapScore(tags: string[], used: Set<string>): number {
  return tags.filter((t) => used.has(t)).length;
}
