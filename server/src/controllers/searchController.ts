import prisma from "../configs/db.js";
import logger from "../configs/loggerConfig.js";
import createHttpError from "http-errors";
import {
  buildSnippet,
  fuzzyMatch,
  prepareQuery,
} from "../utils/fuzzySearch.js";

// ─────────────────────────────────────────────────────────────────────────────
// searchMessages
//
// Fuzzy, ranked search across message content, powering the AI chat dialog's
// Text Search panel. Searches ALL branches of ALL messages (not just what's
// on a chat's activePath) — a match could be sitting on an edited-away or
// non-active sibling branch, and it must still be findable.
//
// scope="chat"  → filters to the given chatId
// scope="all"   → every chat the requesting user owns (never global)
//
// Matching is done by utils/fuzzySearch.ts (typo tolerance, partial words,
// word-order independence, stemming, ranking). It runs in the application
// layer on the user's own messages, so it needs NO database extension or
// migration — the old tsvector `searchVector` column is no longer used.
// ─────────────────────────────────────────────────────────────────────────────

// Safety valve: the most recent N messages of the user are considered. Plenty
// for a personal chat history, and it bounds memory/CPU per keystroke.
const MAX_CANDIDATES = 6000;

export const searchMessages = async (req, res, next) => {
  const userId = req.user?.Id || req.user?.userId;
  const { q, scope, chatId, cursor, limit } = req.query;

  try {
    if (!userId) {
      throw createHttpError.Unauthorized("Please sign in to search your chats");
    }
    if (!q || typeof q !== "string" || !q.trim()) {
      throw createHttpError.BadRequest("Please provide a search query");
    }
    if (scope !== "chat" && scope !== "all") {
      throw createHttpError.BadRequest('scope must be "chat" or "all"');
    }
    if (scope === "chat" && (!chatId || typeof chatId !== "string")) {
      throw createHttpError.BadRequest(
        'chatId is required when scope is "chat"',
      );
    }

    const take = Math.min(Number(limit) || 20, 50);
    const skip = Math.max(Number(cursor) || 0, 0);

    const query = prepareQuery(q.trim().slice(0, 200));
    if (!query) {
      return res.status(200).json({ success: true, results: [], nextCursor: null });
    }

    const rows = await prisma.message.findMany({
      where: {
        text: { not: "" },
        Chat: {
          userId,
          ...(scope === "chat" ? { id: chatId as string } : {}),
        },
      },
      select: {
        id: true,
        ChatId: true,
        role: true,
        text: true,
        createdAt: true,
        Chat: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: MAX_CANDIDATES,
    });

    const scored: Array<{
      row: (typeof rows)[number];
      score: number;
      ranges: Array<[number, number]>;
    }> = [];
    for (const row of rows) {
      const m = fuzzyMatch(query, row.text);
      if (m) scored.push({ row, score: m.score, ranges: m.ranges });
    }

    // Best match first; newer wins ties (rows are already newest-first and
    // Array.prototype.sort is stable).
    scored.sort((a, b) => b.score - a.score);

    const page = scored.slice(skip, skip + take);
    const hasMore = scored.length > skip + take;

    const results = page.map(({ row, score, ranges }) => {
      const { snippet, highlights } = buildSnippet(row.text, ranges);
      return {
        messageId: row.id,
        chatId: row.ChatId,
        chatTitle: row.Chat.title,
        role: row.role,
        snippet,
        highlights,
        // Kept so older client builds that read a single range still work.
        matchStart: highlights[0]?.[0] ?? null,
        matchEnd: highlights[0]?.[1] ?? null,
        score: Number(score.toFixed(3)),
        createdAt: row.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      results,
      nextCursor: hasMore ? String(skip + take) : null,
    });
  } catch (error) {
    logger.error("Error in searchMessages controller", error);
    next(error);
  }
};
