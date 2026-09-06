import prisma from "../configs/db.js";
import logger from "../configs/loggerConfig.js";
import createHttpError from "http-errors";
import { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// searchMessages
//
// Full-text search across message content, powering the AI chat dialog's
// Text Search panel. Searches ALL branches of ALL messages (not just what's
// on a chat's activePath) — a match could be sitting on an edited-away or
// non-active sibling branch, and it must still be findable.
//
// scope="chat"  → filters to the given chatId
// scope="all"   → every chat the requesting user owns (never global)
//
// Uses the generated `searchVector` tsvector column (see
// server/prisma/sql/add_message_search_vector.sql) via raw SQL, since
// Prisma's query builder has no native tsvector/tsquery support.
// ─────────────────────────────────────────────────────────────────────────────

interface SearchRow {
  id: string;
  chatId: string;
  chatTitle: string;
  role: string;
  text: string;
  createdAt: Date;
  rank: number;
}

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

    const query = q.trim();
    const take = Math.min(Number(limit) || 20, 50);
    const skip = Math.max(Number(cursor) || 0, 0);

    const chatFilter =
      scope === "chat"
        ? Prisma.sql`AND m."ChatId" = ${chatId}`
        : Prisma.empty;

    // LIMIT take+1 so we can tell whether there's another page without a
    // separate COUNT(*) query.
    const rows = await prisma.$queryRaw<SearchRow[]>(Prisma.sql`
      SELECT
        m.id,
        m."ChatId"    AS "chatId",
        c.title       AS "chatTitle",
        m.role::text  AS "role",
        m.text,
        m."createdAt",
        ts_rank(m."searchVector", plainto_tsquery('english', ${query})) AS rank
      FROM "Message" m
      JOIN "Chat" c ON c.id = m."ChatId"
      WHERE c."userId" = ${userId}
        AND m."searchVector" @@ plainto_tsquery('english', ${query})
        ${chatFilter}
      ORDER BY rank DESC, m."createdAt" DESC
      LIMIT ${take + 1}
      OFFSET ${skip}
    `);

    const hasMore = rows.length > take;
    const pageRows = hasMore ? rows.slice(0, take) : rows;

    const lowerQuery = query.toLowerCase();
    const results = pageRows.map((row) => {
      const matchStart = row.text.toLowerCase().indexOf(lowerQuery);
      return {
        messageId: row.id,
        chatId: row.chatId,
        chatTitle: row.chatTitle,
        role: row.role,
        snippet: row.text,
        matchStart: matchStart === -1 ? null : matchStart,
        matchEnd: matchStart === -1 ? null : matchStart + query.length,
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
