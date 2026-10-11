import prisma from "../configs/db.js";
import createHttpError from "http-errors";
import logger from "../configs/loggerConfig.js";
import { Difficulty, Prisma } from "@prisma/client";

/**
 * Endpoints that power the problem-detail page's Problem List sidebar and
 * its previous / next arrows.
 *
 * They are deliberately separate from `getProblems` / `searchProblems`
 * (used by the /problems page and the command bar) so that nothing those
 * features rely on can change: different route, different response shape,
 * different pagination model.
 */

const DIFFICULTIES: readonly string[] = ["easy", "medium", "hard"];
const STATUSES = ["solved", "attempted", "unsolved"] as const;
type ProblemStatus = (typeof STATUSES)[number];

const DEFAULT_LIMIT = 20;
// Upper bound for `limit`. The client asks for "as many rows as are already
// loaded" when it refreshes the list in place (e.g. right after login), so
// this has to be comfortably larger than one page.
const MAX_LIMIT = 200;

const parseCsv = (value: unknown): string[] =>
  typeof value === "string"
    ? value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
    : [];

const parseIntParam = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * GET /problem/navigationList
 *
 * Cursor-paginated list, ordered by problem id ascending (the same order the
 * previous / next arrows walk).
 *
 * Query params (all optional):
 *   cursor      - id of the last problem the client already has (exclusive)
 *   limit       - page size, 1..200 (default 20)
 *   q           - case-insensitive title search
 *   difficulty  - comma separated: easy,medium,hard (matches any)
 *   tags        - comma separated (matches any)
 *   status      - solved | attempted | unsolved   (ignored for guests)
 *
 * "attempted" = the user has at least one submission for the problem but has
 * not solved it. "unsolved" = the user has never submitted to it.
 */
export const getProblemNavigationList = async (req, res, next) => {
  try {
    const userId: number | null = req.user?.userId ?? req.user?.id ?? null;

    const requestedLimit = parseIntParam(req.query.limit);
    const limit =
      requestedLimit === null
        ? DEFAULT_LIMIT
        : Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
    const cursor = parseIntParam(req.query.cursor);

    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const difficulties = parseCsv(req.query.difficulty).filter((d) =>
      DIFFICULTIES.includes(d),
    ) as Difficulty[];
    const tags = parseCsv(req.query.tags);

    const statusParam = req.query.status;
    const status: ProblemStatus | null =
      userId &&
      typeof statusParam === "string" &&
      (STATUSES as readonly string[]).includes(statusParam)
        ? (statusParam as ProblemStatus)
        : null;

    const filters: Prisma.ProblemWhereInput[] = [];
    if (q) filters.push({ title: { contains: q, mode: "insensitive" } });
    if (difficulties.length) filters.push({ difficulty: { in: difficulties } });
    if (tags.length) filters.push({ tags: { hasSome: tags } });

    if (userId && status === "solved") {
      filters.push({ solvedProblems: { some: { userId } } });
    } else if (userId && status === "attempted") {
      filters.push({ solvedProblems: { none: { userId } } });
      filters.push({ submissions: { some: { userId } } });
    } else if (userId && status === "unsolved") {
      filters.push({ solvedProblems: { none: { userId } } });
      filters.push({ submissions: { none: { userId } } });
    }

    const where: Prisma.ProblemWhereInput = filters.length
      ? { AND: filters }
      : {};
    const pageWhere: Prisma.ProblemWhereInput =
      cursor === null ? where : { AND: [...filters, { id: { gt: cursor } }] };

    // One extra row tells us whether another page exists without a count.
    const rows = await prisma.problem.findMany({
      where: pageWhere,
      orderBy: { id: "asc" },
      take: limit + 1,
      select: { id: true, title: true, difficulty: true, tags: true },
    });

    const hasNextPage = rows.length > limit;
    const page = hasNextPage ? rows.slice(0, limit) : rows;

    // Per-problem status, only for the rows we are actually returning.
    const solvedIds = new Set<number>();
    const attemptedIds = new Set<number>();
    if (userId && page.length > 0) {
      const ids = page.map((p) => p.id);
      const [solved, submitted] = await Promise.all([
        prisma.solvedProblems.findMany({
          where: { userId, problemId: { in: ids } },
          select: { problemId: true },
        }),
        prisma.submission.findMany({
          where: { userId, problemId: { in: ids } },
          select: { problemId: true },
          distinct: ["problemId"],
        }),
      ]);
      solved.forEach((r) => solvedIds.add(r.problemId));
      submitted.forEach((r) => attemptedIds.add(r.problemId));
    }

    const data = page.map((problem) => ({
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      tags: problem.tags,
      status: userId
        ? solvedIds.has(problem.id)
          ? "solved"
          : attemptedIds.has(problem.id)
            ? "attempted"
            : "unsolved"
        : null,
    }));

    // Totals and the progress summary are only needed when the client is
    // (re)starting the list, not on every "load more" request.
    let total: number | null = null;
    let summary: { total: number; solved: number; attempted: number } | null =
      null;

    if (cursor === null) {
      const [matching, allProblems, solvedCount, attemptedCount] =
        await Promise.all([
          prisma.problem.count({ where }),
          userId ? prisma.problem.count() : Promise.resolve(0),
          userId
            ? prisma.solvedProblems.count({ where: { userId } })
            : Promise.resolve(0),
          userId
            ? prisma.problem.count({
                where: {
                  solvedProblems: { none: { userId } },
                  submissions: { some: { userId } },
                },
              })
            : Promise.resolve(0),
        ]);
      total = matching;
      if (userId) {
        summary = {
          total: allProblems,
          solved: solvedCount,
          attempted: attemptedCount,
        };
      }
    }

    res.status(200).json({
      message: "Problems fetched successfully",
      data,
      pagination: {
        nextCursor: hasNextPage ? page[page.length - 1].id : null,
        hasNextPage,
        total,
      },
      summary,
    });
  } catch (error) {
    logger.error("Error fetching problem navigation list:", error);
    next(error);
  }
};

/**
 * GET /problem/adjacent?title=<title>   (or ?id=<id>)
 *
 * Returns the previous and next problem by id across ALL problems, which is
 * what the navbar's left / right arrows navigate to. Either neighbour is
 * `null` at the ends of the list. Deleted problems simply leave gaps in the
 * ids, so the neighbours are the closest existing ids, not id +/- 1.
 */
export const getAdjacentProblems = async (req, res, next) => {
  try {
    const id = parseIntParam(req.query.id);
    const title = typeof req.query.title === "string" ? req.query.title : null;

    let current: { id: number; title: string } | null;
    if (id !== null) {
      current = await prisma.problem.findUnique({
        where: { id },
        select: { id: true, title: true },
      });
    } else if (title) {
      current = await prisma.problem.findFirst({
        where: { title },
        select: { id: true, title: true },
      });
    } else {
      throw createHttpError(400, "Either id or title is required");
    }

    if (!current) {
      throw createHttpError(404, "Problem not found");
    }

    const [prevProblem, nextProblem] = await Promise.all([
      prisma.problem.findFirst({
        where: { id: { lt: current.id } },
        orderBy: { id: "desc" },
        select: { id: true, title: true },
      }),
      prisma.problem.findFirst({
        where: { id: { gt: current.id } },
        orderBy: { id: "asc" },
        select: { id: true, title: true },
      }),
    ]);

    res.status(200).json({
      message: "Adjacent problems fetched successfully",
      data: { current, prev: prevProblem, next: nextProblem },
    });
  } catch (error) {
    logger.error("Error fetching adjacent problems:", error);
    next(error);
  }
};
