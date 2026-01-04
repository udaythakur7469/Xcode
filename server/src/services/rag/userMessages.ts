import prisma from "../../configs/db.js";

export const fetchPreviousUserMessages = async (
  chatId: string,
  limit: number
): Promise<string[]> => {
  const messages = await prisma.message.findMany({
    where: {
      ChatId: chatId,
      role: "user",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    select: {
      text: true,
    },
  });

  // Reverse to get oldest → newest order
  return messages.reverse().map((m) => m.text);
};
