import prisma from "../../configs/db.js";

export const getOrUpdateRegenerateState = async (
  chatId: string,
  userMessageId: string,
  regenerate: boolean,
  aiModel: string,
  lastMessageModel: string
): Promise<{ regenerateCount: number; aiModelChanged: boolean }> => {
  // Check if model changed
  const aiModelChanged = lastMessageModel !== aiModel;

  // If not regenerating and model hasn't changed, return default
  if (!regenerate && !aiModelChanged) {
    return { regenerateCount: 0, aiModelChanged: false };
  }

  // Check for existing regenerate state
  const existing = await prisma.regenerateState.findUnique({
    where: { userMessageId },
  });

  if (aiModelChanged) {
    // Model change: set count to 1
    if (existing) {
      await prisma.regenerateState.update({
        where: { userMessageId },
        data: {
          regenerateCount: 0,
          lastUsedModel: aiModel,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.regenerateState.create({
        data: {
          chatId,
          userMessageId,
          regenerateCount: 0,
          lastUsedModel: aiModel,
        },
      });
    }
    return { regenerateCount: 0, aiModelChanged: true };
  }

  if (regenerate) {
    if (existing) {
      // Increment regenerate count
      const updated = await prisma.regenerateState.update({
        where: { userMessageId },
        data: {
          regenerateCount: { increment: 1 },
          lastUsedModel: aiModel,
          updatedAt: new Date(),
        },
      });
      return {
        regenerateCount: updated.regenerateCount,
        aiModelChanged: false,
      };
    } else {
      // First regenerate: create with count = 1
      const created = await prisma.regenerateState.create({
        data: {
          chatId,
          userMessageId,
          regenerateCount: 1,
          lastUsedModel: aiModel,
        },
      });
      return {
        regenerateCount: created.regenerateCount,
        aiModelChanged: false,
      };
    }
  }

  return { regenerateCount: 0, aiModelChanged: false };
};
