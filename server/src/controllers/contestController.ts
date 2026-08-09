import prisma from "../configs/db.js";
import createHttpError from "http-errors";
import logger from "../configs/loggerConfig.js";
import { getTitleForRating } from "../utils/titles.js";
import { unlock as unlockAchievementInternal } from "../services/achievementService.js";
import { scheduleContestReminders } from "../queues/contestReminderQueue.js";
import { ContestStatus } from "@prisma/client";

// ── List contests (upcoming + past), paginated + searchable ───────────────
// GET /api/contest?status=upcoming|past&page=1&pageSize=6&q=weekly
export const listContests = async (req, res, next) => {
  try {
    const status = (req.query.status as string) === "past" ? "past" : "upcoming";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 6));
    const q = ((req.query.q as string) || "").trim();

    const where = {
      ...(status === "upcoming"
        ? { status: { in: ["SCHEDULED", "LIVE"] as ContestStatus[] } }
        : { status: "ENDED" as ContestStatus }),
      ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
    };

    const [contests, total] = await Promise.all([
      prisma.contest.findMany({
        where,
        orderBy: { startTime: status === "upcoming" ? "asc" : "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          startTime: true,
          endTime: true,
          status: true,
          _count: { select: { participants: true } },
        },
      }),
      prisma.contest.count({ where }),
    ]);

    res.status(200).json({
      contests,
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    });
  } catch (err) {
    next(err);
  }
};

// ── Single contest (lobby page) ────────────────────────────────────────────
// GET /api/contest/:slug
export const getContestBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const contest = await prisma.contest.findUnique({
      where: { slug },
      include: {
        _count: { select: { participants: true } },
        problems: {
          orderBy: { label: "asc" },
          select: { id: true, label: true, points: true, problem: { select: { difficulty: true } } },
        },
      },
    });
    if (!contest) return next(createHttpError.NotFound("Contest not found"));

    const userId = req.user?.id ?? req.user?.userId;
    let isRegistered = false;
    if (userId) {
      const participant = await prisma.contestParticipant.findUnique({
        where: { contestId_userId: { contestId: contest.id, userId } },
      });
      isRegistered = !!participant;
    }

    res.status(200).json({ ...contest, isRegistered });
  } catch (err) {
    next(err);
  }
};

// ── Register for a contest ─────────────────────────────────────────────────
// POST /api/contest/:id/register — requires auth
export const registerForContest = async (req, res, next) => {
  try {
    const userId = req.user?.id ?? req.user?.userId;
    const contestId = parseInt(req.params.id, 10);

    const contest = await prisma.contest.findUnique({ where: { id: contestId } });
    if (!contest) return next(createHttpError.NotFound("Contest not found"));
    if (contest.status === "ENDED") {
      return next(createHttpError.BadRequest("This contest has already ended"));
    }

    const participant = await prisma.contestParticipant.upsert({
      where: { contestId_userId: { contestId, userId } },
      update: {},
      create: { contestId, userId },
    });

    await scheduleContestReminders({
      contestId,
      userId,
      contestType: contest.type,
      startTime: contest.startTime,
    }).catch((err) => {
      logger.error("Failed to schedule contest reminder emails:", err);
    });

    res.status(200).json({ message: "Registered", participant });
  } catch (err) {
    next(err);
  }
};

// ── Contest workspace: problems (gated) ────────────────────────────────────
// GET /api/contest/:id/workspace — requires auth + registration + contest LIVE
export const getContestWorkspace = async (req, res, next) => {
  try {
    const userId = req.user?.id ?? req.user?.userId;
    const contestId = parseInt(req.params.id, 10);

    const [contest, participant] = await Promise.all([
      prisma.contest.findUnique({
        where: { id: contestId },
        include: {
          problems: {
            orderBy: { label: "asc" },
            include: {
              problem: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  difficulty: true,
                  tags: true,
                  examples: true,
                  constraints: true,
                  baseCodes: true,
                },
              },
            },
          },
        },
      }),
      prisma.contestParticipant.findUnique({
        where: { contestId_userId: { contestId, userId } },
      }),
    ]);

    if (!contest) return next(createHttpError.NotFound("Contest not found"));
    if (!participant) {
      return next(createHttpError.Forbidden("Register for this contest first"));
    }
    if (contest.status === "SCHEDULED") {
      return next(createHttpError.BadRequest("This contest hasn't started yet"));
    }

    // Same freeze rule as the leaderboard endpoint — the participant's
    // own displayed rank freezes too, not just everyone else's,
    // otherwise their own rank shifting would leak information about
    // what's happening elsewhere on the frozen board.
    let displayParticipant = participant;
    if (contest.status === "LIVE" && contest.frozenStandings) {
      const snapshot = contest.frozenStandings as { userId: number; rank: number }[];
      const frozenRow = snapshot.find((s) => s.userId === participant.userId);
      if (frozenRow) {
        displayParticipant = { ...participant, rank: frozenRow.rank };
      }
    }

    res.status(200).json({
      contest: {
        id: contest.id,
        title: contest.title,
        startTime: contest.startTime,
        endTime: contest.endTime,
        status: contest.status,
      },
      participant: displayParticipant,
      problems: contest.problems,
    });
  } catch (err) {
    next(err);
  }
};

// ── Live leaderboard, paginated + searchable ───────────────────────────────
// GET /api/contest/:id/leaderboard?page=1&pageSize=25&q=
export const getContestLeaderboard = async (req, res, next) => {
  try {
    const contestId = parseInt(req.params.id, 10);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 25));
    const q = ((req.query.q as string) || "").trim().toLowerCase();

    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      select: { status: true, frozenStandings: true },
    });
    if (!contest) return next(createHttpError.NotFound("Contest not found"));

    // Standings freeze for the last 25% of every contest (see the
    // freeze-leaderboard design discussion) — while LIVE and a snapshot
    // exists, serve that static snapshot instead of live data. Once the
    // contest ends, frozenStandings is simply ignored and the real,
    // final, settled standings take over automatically.
    const isFrozen = contest.status === "LIVE" && !!contest.frozenStandings;

    if (isFrozen) {
      const snapshot = contest.frozenStandings as {
        userId: number;
        rank: number;
        solvedCount: number;
        penaltyMins: number;
        totalPoints: number;
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
          };
        })
        .sort((a, b) => a.rank - b.rank);

      if (q) {
        leaderboard = leaderboard.filter((row) => row.name.toLowerCase().includes(q));
      }

      const total = leaderboard.length;
      const page_ = leaderboard.slice((page - 1) * pageSize, page * pageSize);

      return res.status(200).json({
        leaderboard: page_,
        page,
        pageSize,
        total,
        hasMore: page * pageSize < total,
        frozen: true,
      });
    }

    const where = {
      contestId,
      ...(q ? { user: { name: { contains: q, mode: "insensitive" as const } } } : {}),
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

    const leaderboard = rows.map((row) => ({
      userId: row.userId,
      name: row.user.name,
      rating: row.user.contestRating,
      title: getTitleForRating(row.user.contestRating).name,
      rank: row.rank,
      solvedCount: row.solvedCount,
      penaltyMins: row.penaltyMins,
      totalPoints: row.totalPoints,
      ratingDelta: row.ratingDelta,
    }));

    res.status(200).json({ leaderboard, page, pageSize, total, hasMore: page * pageSize < total, frozen: false });
  } catch (err) {
    next(err);
  }
};

// ── Contest profile: rating, peak, history, achievements ──────────────────
// GET /api/contest/profile/:userId
export const getContestProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId, 10);

    const [user, history, achievements, participantCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, contestRating: true, peakRating: true },
      }),
      prisma.ratingHistory.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        include: { contest: { select: { title: true, type: true } } },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { unlockedAt: "desc" },
      }),
      prisma.contestParticipant.count({ where: { userId } }),
    ]);

    if (!user) return next(createHttpError.NotFound("User not found"));

    res.status(200).json({
      user: {
        ...user,
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

// ── Contest Journey: chronological milestone timeline ─────────────────────
// GET /api/contest/journey/:userId
export const getContestJourney = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId, 10);

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

    type MilestoneType = "start" | "title" | "achievement" | "peak";
    type Milestone = {
      date: Date;
      type: MilestoneType;
      title: string;
      description: string;
      icon: string;
      rating: number; // plots this milestone on the client's Ascent graph
    };
    const milestones: Milestone[] = [];

    // Achievements aren't rating snapshots, so the Ascent graph needs an
    // approximate y-value for them too — the most recent rating at or
    // before the achievement's unlock time (falling back to the
    // earliest known rating if it was unlocked before any rated contest).
    const ratingAtOrBefore = (date: Date): number => {
      let latest = history.length > 0 ? history[0].rating - history[0].delta : 1200;
      for (const h of history) {
        if (h.createdAt.getTime() <= date.getTime()) latest = h.rating;
        else break;
      }
      return latest;
    };

    if (history.length > 0) {
      const first = history[0];
      const startingRating = first.rating - first.delta;
      milestones.push({
        date: first.createdAt,
        type: "start",
        title: "First Contest",
        description: `Registered for ${first.contest.title} — rating set to ${startingRating}.`,
        icon: "🚀",
        rating: startingRating,
      });

      let lastTitle = getTitleForRating(startingRating).name;
      let peakSoFar = startingRating;
      let biggestGain = { delta: -Infinity, contestTitle: "", rating: startingRating };

      for (const h of history) {
        const currentTitle = getTitleForRating(h.rating).name;
        if (currentTitle !== lastTitle) {
          milestones.push({
            date: h.createdAt,
            type: "title",
            title: `Title Unlocked: ${currentTitle}`,
            description: `Reached a contest rating of ${h.rating}.`,
            icon: getTitleForRating(h.rating).icon,
            rating: h.rating,
          });
          lastTitle = currentTitle;
        }
        if (h.rating > peakSoFar) {
          peakSoFar = h.rating;
          milestones.push({
            date: h.createdAt,
            type: "peak",
            title: `New Peak Rating: ${h.rating}`,
            description: `Highest rating reached so far, from ${h.contest.title}.`,
            icon: "⛰",
            rating: h.rating,
          });
        }
        if (h.delta > biggestGain.delta) {
          biggestGain = { delta: h.delta, contestTitle: h.contest.title, rating: h.rating };
        }
      }

      if (biggestGain.delta > 0) {
        milestones.push({
          date: history[history.length - 1].createdAt,
          type: "peak",
          title: "Biggest Rating Gain",
          description: `+${biggestGain.delta} in a single contest — ${biggestGain.contestTitle}.`,
          icon: "📈",
          rating: biggestGain.rating,
        });
      }
    }

    for (const a of achievements) {
      milestones.push({
        date: a.unlockedAt,
        type: "achievement",
        title: `Achievement: ${a.achievement.name}`,
        description: a.achievement.description,
        icon: a.achievement.icon,
        rating: ratingAtOrBefore(a.unlockedAt),
      });
    }

    milestones.sort((a, b) => a.date.getTime() - b.date.getTime());

    res.status(200).json({ milestones });
  } catch (err) {
    next(err);
  }
};

// ── Admin: manually award a badge (Upset Winner, Comeback — see the note
// in achievementService.ts on why these aren't auto-detected) ─────────────
// POST /api/contest/admin/award-badge — requires ADMIN role
export const awardBadgeManually = async (req, res, next) => {
  try {
    const { userId, achievementKey, contestId } = req.body;
    if (!userId || !achievementKey) {
      return next(createHttpError.BadRequest("userId and achievementKey are required"));
    }
    await unlockAchievementInternal(userId, achievementKey, contestId);
    res.status(200).json({ message: "Badge awarded" });
  } catch (err) {
    next(err);
  }
};
