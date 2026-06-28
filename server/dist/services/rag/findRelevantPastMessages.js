import logger from "../../configs/loggerConfig.js";
import prisma from "../../configs/db.js";
export const findRelevantPastMessages = async (input) => {
    const { chatId, activePath, currentEmbedding, excludeRecentCount, limit, similarityThreshold, } = input;
    // Guard: if the path is too short to have any non-recent messages, skip.
    if (activePath.length === 0)
        return [];
    // Build the search space: activePath minus the most recent N messages
    // (those are already in the recentMessages context window — no need to
    // retrieve them again via vector search).
    //
    // This is the core fix: the search space is an explicit whitelist of IDs
    // from the current branch lineage only. Sibling branch messages are never
    // in activePath, so they can never appear in searchableIds, so the
    // pgvector query structurally cannot return them. Context pollution is
    // impossible by construction.
    const recentIds = new Set(activePath.slice(-excludeRecentCount));
    const searchableIds = activePath.filter((id) => !recentIds.has(id));
    if (searchableIds.length === 0)
        return [];
    try {
        // pgvector cosine similarity search — filtered to activePath whitelist.
        // PostgreSQL uses the primary key index on MessageEmbedding.messageId to
        // filter rows BEFORE computing cosine distance. Fast and branch-safe.
        const results = await prisma.$queryRaw `
      SELECT
        "messageId",
        content,
        1 - (embedding <=> ${currentEmbedding}::vector) AS similarity,
        "createdAt"
      FROM "MessageEmbedding"
      WHERE "messageId" = ANY(${searchableIds}::text[])
        AND role = 'user'::"MessageRole"
        AND 1 - (embedding <=> ${currentEmbedding}::vector) >= ${similarityThreshold}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;
        const mappedResults = results.map((row) => ({
            messageId: row.messageId,
            content: row.content,
            similarity: Number(row.similarity),
            createdAt: row.createdAt,
        }));
        logger.info("Semantic backtracking: past messages retrieved", {
            chatId,
            searchSpaceSize: searchableIds.length,
            foundCount: mappedResults.length,
            similarities: mappedResults.map((r) => parseFloat(r.similarity.toFixed(3))),
        });
        return mappedResults;
    }
    catch (error) {
        logger.error("Semantic backtracking: query failed — returning empty", {
            error,
            chatId,
        });
        return [];
    }
};
