import prisma from "../configs/db.js";
import createHttpError from "http-errors";
import logger from "../configs/loggerConfig.js";
import { getTitleForRating } from "../utils/titles.js";
import { ACHIEVEMENT_CATALOG } from "../services/achievementService.js";
import { ContestStatus } from "@prisma/client";

// ─── contestController ───────────────────────────────────────────────────
// See CONTEST_SYSTEM_EXPLAINED.md §9 for what each endpoint is
// responsible for, conceptually, before diving into the implementation
// below.

// ── List contests (upcoming/past, paginated, searchable) ──────────────────
// GET /api/contest?tab=upcoming|past&search=&page=
export const listContests = async (req, res, next) => {
  try {
    const tab = (req.query.tab as string) || "upcoming";
    const search = (req.query.search as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = 20;

    const statusFilter: ContestStatus[] = tab === "past" ? ["ENDED"] : ["SCHEDULED", "LIVE"];

    const where = {
      status: { in: statusFilter },
      ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const [contests, total] = await Promise.all([
      prisma.contest.findMany({
        where,
        orderBy: { startTime: tab === "past" ? "desc" : "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { participants: true, problems: true } } },
      }),
      prisma.contest.count({ where }),
    ]);

    const userId = req.user?.id ?? req.user?.userId ?? null;
    const nextContest = await prisma.contest.findFirst({
      where: { status: { in: ["SCHEDULED", "LIVE"] } },
      orderBy: { startTime: "asc" },
      include: { _count: { select: { participants: true, problems: true } } },
    });

    let userRating: { rating: number; title: string } | null = null;
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { contestRating: true } });
      if (user) userRating = { rating: user.contestRating, title: getTitleForRating(user.contestRating).name };
    }

    res.status(200).json({
      contests: contests.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        type: c.type,
        status: c.status,
        startTime: c.startTime,
        endTime: c.endTime,
        ratingWeight: c.ratingWeight,
        problemCount: c._count.problems,
        participantCount: c._count.participants,
      })),
      total,
      page,
      pageSize,
      nextContest: nextContest
        ? {
            id: nextContest.id,
            title: nextContest.title,
            slug: nextContest.slug,
            type: nextContest.type,
            status: nextContest.status,
            startTime: nextContest.startTime,
            endTime: nextContest.endTime,
            ratingWeight: nextContest.ratingWeight,
            problemCount: nextContest._count.problems,
            participantCount: nextContest._count.participants,
          }
        : null,
      userRating,
    });
  } catch (err) {
    next(err);
  }
};

// ── Contest lobby detail ───────────────────────────────────────────────────
// GET /api/contest/:slug
export const getContestBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const userId = req.user?.id ?? req.user?.userId ?? null;

    const contest = await prisma.contest.findUnique({
      where: { slug },
      include: { _count: { select: { participants: true } } },
    });
    if (!contest) return next(createHttpError.NotFound("Contest not found"));

    const isRegistered = userId
      ? !!(await prisma.contestParticipant.findUnique({
          where: { contestId_userId: { contestId: contest.id, userId } },
        }))
      : false;

    res.status(200).json({
      contest: {
        id: contest.id,
        title: contest.title,
        slug: contest.slug,
        type: contest.type,
        status: contest.status,
        startTime: contest.startTime,
        endTime: contest.endTime,
        rated: contest.rated,
        ratingWeight: contest.ratingWeight,
        participantCount: contest._count.participants,
        isRegistered,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Register for a contest ─────────────────────────────────────────────────
// POST /api/contest/:id/register
export const registerForContest = async (req, res, next) => {
  try {
    const contestId = parseInt(req.params.id);
    const userId = req.user.id ?? req.user.userId;

    const contest = await prisma.contest.findUnique({ where: { id: contestId } });
    if (!contest) return next(createHttpError.NotFound("Contest not found"));
    if (contest.status === "ENDED") {
      return next(createHttpError.BadRequest("This contest has already ended"));
    }

    const existing = await prisma.contestParticipant.findUnique({
      where: { contestId_userId: { contestId, userId } },
    });
    if (existing) {
      return res.status(200).json({ message: "Already registered" });
    }

    await prisma.contestParticipant.create({ data: { contestId, userId } });
    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    next(err);
  }
};

// ── Workspace — problems + own live state ──────────────────────────────────
// GET /api/contest/:id/workspace
export const getContestWorkspace = async (req, res, next) => {
  try {
    const contestId = parseInt(req.params.id);
    const userId = req.user.id ?? req.user.userId;

    const [contest, participant] = await Promise.all([
      prisma.contest.findUnique({
        where: { id: contestId },
        include: { problems: { include: { problem: true }, orderBy: { label: "asc" } } },
      }),
      prisma.contestParticipant.findUnique({ where: { contestId_userId: { contestId, userId } } }),
    ]);

    if (!contest) return next(createHttpError.NotFound("Contest not found"));
    if (contest.status === "SCHEDULED") {
      return next(createHttpError.BadRequest("This contest hasn't started yet"));
    }

    // Registration is only required while the contest is LIVE — that's
    // the actual competition. Once a contest has ENDED, anyone can open
    // it to practice, registered or not, since nothing they do there
    // affects scoring (see submitCode's contestContext logic — ENDED
    // submissions never get contest bookkeeping attached).
    if (contest.status === "LIVE" && !participant) {
      return next(createHttpError.Forbidden("Register for this contest first"));
    }

    // The participant's own displayed rank freezes too, not just
    // everyone else's — otherwise their own rank shifting would leak
    // information about what's happening elsewhere on the frozen board.
    let displayParticipant = participant;
    if (contest.status === "LIVE" && contest.frozenStandings && participant) {
      const snapshot = contest.frozenStandings as { userId: number; rank: number }[];
      const frozenRow = snapshot.find((s) => s.userId === participant.userId);
      if (frozenRow) displayParticipant = { ...participant, rank: frozenRow.rank };
    }

    // A practicing non-participant on an ENDED contest has no real
    // ContestParticipant row — synthesize a zeroed, display-only one.
    const responseParticipant = displayParticipant ?? {
      userId,
      rank: null,
      solvedCount: 0,
      penaltyMins: 0,
    };

    res.status(200).json({
      contest: {
        id: contest.id,
        title: contest.title,
        startTime: contest.startTime,
        endTime: contest.endTime,
        status: contest.status,
      },
      participant: responseParticipant,
      problems: contest.problems.map((cp) => ({
        id: cp.id,
        label: cp.label,
        points: cp.points,
        problem: {
          id: cp.problem.id,
          title: cp.problem.title,
          description: cp.problem.description,
          constraints: cp.problem.constraints,
          difficulty: cp.problem.difficulty,
          examples: undefined, // fetched separately via the normal problem-detail flow once selected, to keep this payload light
          baseCodes: undefined,
        },
      })),
    });
  } catch (err) {
    next(err);
  }
};

// ── Leaderboard ─────────────────────────────────────────────────────────────
// GET /api/contest/leaderboard/:id?search=&page=
export const getContestLeaderboard = async (req, res, next) => {
  try {
    const contestId = parseInt(req.params.id);
    const search = (req.query.search as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = 50;

    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: { problems: { select: { label: true }, orderBy: { label: "asc" } } },
    });
    if (!contest) return next(createHttpError.NotFound("Contest not found"));

    const problemLabels = contest.problems.map((p) => p.label);
    const isFrozen = contest.status === "LIVE" && contest.frozenStandings !== null;

    if (isFrozen) {
      const snapshot = contest.frozenStandings as {
        userId: number;
        rank: number;
        solvedCount: number;
        penaltyMins: number;
        totalPoints: number;
        solvedProblems: { label: string; submittedAtMins: number }[];
      }[];

      const userIds = snapshot.map((s) => s.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, contestRating: true },
      });
      const userById = new Map(users.map((u) => [u.id, u]));

      let leaderboard = snapshot
        .map((row) => {
          const user = userById.get(row.userId);
          return {
            userId: row.userId,
            name: user?.name ?? "Unknown",
            rating: user?.contestRating ?? 1200,
            title: getTitleForRating(user?.contestRating ?? 1200).name,
            rank: row.rank,
            solvedCount: row.solvedCount,
            penaltyMins: row.penaltyMins,
            totalPoints: row.totalPoints,
            ratingDelta: null, // never known before settlement, frozen or not
            solvedProblems: row.solvedProblems ?? [],
          };
        })
        .sort((a, b) => a.rank - b.rank);

      if (search) {
        leaderboard = leaderboard.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
      }

      const paged = leaderboard.slice((page - 1) * pageSize, page * pageSize);
      return res.status(200).json({
        leaderboard: paged,
        total: leaderboard.length,
        page,
        pageSize,
        isFrozen: true,
        problemLabels,
      });
    }

    const where = {
      contestId,
      ...(search ? { user: { name: { contains: search, mode: "insensitive" as const } } } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.contestParticipant.findMany({
        where,
        orderBy: [{ totalPoints: "desc" }, { penaltyMins: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, name: true, contestRating: true } } },
      }),
      prisma.contestParticipant.count({ where }),
    ]);

    // One query for every solved-problem row across this page, rather
    // than N+1 per participant.
    const accepts = await prisma.contestSubmission.findMany({
      where: { contestId, isFirstAccept: true, userId: { in: rows.map((r) => r.userId) } },
      select: { userId: true, submittedAtMins: true, contestProblem: { select: { label: true } } },
    });
    const solvedByUser = new Map<number, { label: string; submittedAtMins: number }[]>();
    for (const a of accepts) {
      const list = solvedByUser.get(a.userId) ?? [];
      list.push({ label: a.contestProblem.label, submittedAtMins: a.submittedAtMins });
      solvedByUser.set(a.userId, list);
    }

    const leaderboard = rows.map((row) => ({
      userId: row.userId,
      name: row.user.name ?? "Unknown",
      rating: row.user.contestRating,
      title: getTitleForRating(row.user.contestRating).name,
      rank: row.rank,
      solvedCount: row.solvedCount,
      penaltyMins: row.penaltyMins,
      totalPoints: row.totalPoints,
      ratingDelta: row.ratingDelta,
      solvedProblems: solvedByUser.get(row.userId) ?? [],
    }));

    res.status(200).json({ leaderboard, total, page, pageSize, isFrozen: false, problemLabels });
  } catch (err) {
    next(err);
  }
};

// ── Full achievement catalog (locked + unlocked) ────────────────────────────
// GET /api/contest/achievements/catalog
export const getAchievementCatalog = async (req, res, next) => {
  try {
    res.status(200).json({
      achievements: ACHIEVEMENT_CATALOG.map((a) => ({
        key: a.key,
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// ── Contest profile: rating, peak, history, achievements ────────────────────
// GET /api/contest/profile/:userId
export const getContestProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);

    const [user, history, achievements, participantCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, contestRating: true, peakRating: true } }),
      prisma.ratingHistory.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        include: { contest: { select: { title: true, type: true } } },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: "desc" },
        include: { achievement: true },
      }),
      prisma.contestParticipant.count({ where: { userId } }),
    ]);
    if (!user) return next(createHttpError.NotFound("User not found"));

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name ?? "Unknown",
        contestRating: user.contestRating,
        peakRating: user.peakRating,
        title: getTitleForRating(user.contestRating).name,
      },
      contestsPlayed: participantCount,
      ratingHistory: history.map((h) => ({
        contestTitle: h.contest.title,
        contestType: h.contest.type,
        rating: h.rating,
        delta: h.delta,
        date: h.createdAt,
      })),
      achievements: achievements.map((a) => ({
        key: a.achievement.key,
        name: a.achievement.name,
        icon: a.achievement.icon,
        category: a.achievement.category,
        unlockedAt: a.unlockedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// ── Journey — rating history reshaped into narrative milestones ────────────
// GET /api/contest/journey/:userId
export const getContestJourney = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);

    const [history, achievements] = await Promise.all([
      prisma.ratingHistory.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        include: { contest: { select: { title: true, type: true } } },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: "asc" },
        include: { achievement: true },
      }),
    ]);

    const milestones: { date: string; title: string; description: string }[] = [];

    if (history.length > 0) {
      milestones.push({
        date: history[0].createdAt.toISOString(),
        title: "🚀 First contest",
        description: `Registered for ${history[0].contest.title} — rating set to 1200.`,
      });
    }

    let peakSoFar = 1200;
    let biggestGain = { delta: 0, contestTitle: "", date: "" };
    let previousTitle = getTitleForRating(1200).name;

    for (const h of history) {
      if (h.rating > peakSoFar) {
        peakSoFar = h.rating;
        milestones.push({
          date: h.createdAt.toISOString(),
          title: `⛰ New peak rating: ${h.rating}`,
          description: `Highest rating so far, from ${h.contest.title}.`,
        });
      }
      const currentTitle = getTitleForRating(h.rating).name;
      if (currentTitle !== previousTitle) {
        milestones.push({
          date: h.createdAt.toISOString(),
          title: `▲ Title unlocked: ${currentTitle}`,
          description: `Reached a contest rating of ${h.rating}.`,
        });
        previousTitle = currentTitle;
      }
      if (h.delta > biggestGain.delta) {
        biggestGain = { delta: h.delta, contestTitle: h.contest.title, date: h.createdAt.toISOString() };
      }
    }

    if (biggestGain.delta > 0) {
      milestones.push({
        date: biggestGain.date,
        title: `📈 Biggest rating gain — +${biggestGain.delta}`,
        description: biggestGain.contestTitle,
      });
    }

    for (const a of achievements) {
      milestones.push({
        date: a.unlockedAt.toISOString(),
        title: `${a.achievement.icon} Achievement unlocked: ${a.achievement.name}`,
        description: a.achievement.description,
      });
    }

    milestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.status(200).json({ milestones });
  } catch (err) {
    next(err);
  }
};
