import prisma from "../../configs/db.js";
export const getOrUpdateRegenerateState = async (chatId, userMessageId, regenerate, aiModel, lastMessageModel) => {
    const aiModelChanged = lastMessageModel !== aiModel;
    // Fast path — no DB read needed for normal first request
    if (!regenerate && !aiModelChanged) {
        return {
            regenerateCount: 0,
            aiModelChanged: false,
            lastRetrievalConfidence: 0,
        };
    }
    const existing = await prisma.regenerateState.findUnique({
        where: { userMessageId },
        select: {
            regenerateCount: true,
            lastUsedModel: true,
            lastRetrievalConfidence: true, // ← NEW
        },
    });
    if (aiModelChanged) {
        if (existing) {
            await prisma.regenerateState.update({
                where: { userMessageId },
                data: {
                    regenerateCount: 0,
                    lastUsedModel: aiModel,
                    updatedAt: new Date(),
                },
            });
        }
        else {
            await prisma.regenerateState.create({
                data: {
                    chatId,
                    userMessageId,
                    regenerateCount: 0,
                    lastUsedModel: aiModel,
                },
            });
        }
        return {
            regenerateCount: 0,
            aiModelChanged: true,
            lastRetrievalConfidence: existing?.lastRetrievalConfidence ?? 0,
        };
    }
    if (regenerate) {
        if (existing) {
            const updated = await prisma.regenerateState.update({
                where: { userMessageId },
                data: {
                    regenerateCount: { increment: 1 },
                    lastUsedModel: aiModel,
                    updatedAt: new Date(),
                },
                select: {
                    regenerateCount: true,
                    lastRetrievalConfidence: true,
                },
            });
            return {
                regenerateCount: updated.regenerateCount,
                aiModelChanged: false,
                lastRetrievalConfidence: updated.lastRetrievalConfidence ?? 0,
            };
        }
        else {
            const created = await prisma.regenerateState.create({
                data: {
                    chatId,
                    userMessageId,
                    regenerateCount: 1,
                    lastUsedModel: aiModel,
                },
                select: {
                    regenerateCount: true,
                    lastRetrievalConfidence: true,
                },
            });
            return {
                regenerateCount: created.regenerateCount,
                aiModelChanged: false,
                lastRetrievalConfidence: created.lastRetrievalConfidence ?? 0,
            };
        }
    }
    return {
        regenerateCount: 0,
        aiModelChanged: false,
        lastRetrievalConfidence: 0,
    };
};
