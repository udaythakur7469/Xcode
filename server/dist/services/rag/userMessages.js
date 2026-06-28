import prisma from "../../configs/db.js";
import logger from "../../configs/loggerConfig.js";
// fetchPreviousUserMessages
//
// CHANGED: signature from (chatId, limit) → ({ activePath, limit }).
//
// Takes the last `limit` IDs from activePath (which is ordered root→leaf),
// fetches only those messages, re-sorts them to match activePath order,
// then filters to user role. This guarantees:
//   1. Only messages on the current branch lineage are returned
//   2. Order matches the tree path, not wall-clock createdAt
//   3. Cross-branch messages are structurally impossible to appear
//
export const fetchPreviousUserMessages = async ({ activePath, limit, }) => {
    if (activePath.length === 0 || limit === 0)
        return [];
    // Take the last `limit` nodes from activePath (most recent messages on branch)
    const recentIds = activePath.slice(-limit);
    try {
        const messages = await prisma.message.findMany({
            where: {
                id: { in: recentIds },
                role: "user",
            },
            select: {
                id: true,
                text: true,
            },
        });
        // findMany with `in` does not preserve order — re-sort to activePath order
        const idToMsg = new Map(messages.map((m) => [m.id, m]));
        return recentIds
            .map((id) => idToMsg.get(id))
            .filter((m) => m !== undefined)
            .map((m) => m.text);
    }
    catch (error) {
        logger.error("fetchPreviousUserMessages failed", { error });
        return [];
    }
};
