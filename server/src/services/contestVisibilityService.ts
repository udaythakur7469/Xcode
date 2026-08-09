import prisma from "../configs/db.js";

/**
 * Problems a specific user cannot access outside the contest workspace
 * right now — because they're registered for a not-yet-ended contest
 * that includes that problem. This is intentionally scoped per user, not
 * global: a problem reused from the public bank stays fully visible and
 * solvable for everyone who ISN'T registered for the contest using it.
 * See the "per-user visibility" design discussion for the full reasoning.
 *
 * The block starts the moment a user registers (not at contest
 * generation time — there's no way to block a not-yet-registered future
 * participant, since they don't exist as a queryable fact yet) and ends
 * the moment the contest's status flips to ENDED.
 */
export async function getHiddenContestProblemIdsForUser(
  userId: number | null,
): Promise<Set<number>> {
  if (!userId) return new Set();

  const rows = await prisma.contestProblem.findMany({
    where: {
      contest: {
        status: { not: "ENDED" },
        participants: { some: { userId } },
      },
    },
    select: { problemId: true },
  });

  return new Set(rows.map((r) => r.problemId));
}

/** Single-problem version — cheaper than the full-set query when you only need one answer (e.g. getProblemByTitle). */
export async function isProblemHiddenForUser(
  userId: number | null,
  problemId: number,
): Promise<boolean> {
  if (!userId) return false;

  const match = await prisma.contestProblem.findFirst({
    where: {
      problemId,
      contest: {
        status: { not: "ENDED" },
        participants: { some: { userId } },
      },
    },
    select: { id: true },
  });

  return !!match;
}
