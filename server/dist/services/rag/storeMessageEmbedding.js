// server/src/services/rag/storeMessageEmbedding.ts
import logger from "../../configs/loggerConfig.js";
import prisma from "../../configs/db.js";
import { generateEmbedding } from "./embeddings.js";
// Stores a vector embedding for a single message in the MessageEmbedding
// table so future semantic backtracking (findRelevantPastMessages) can
// retrieve it by cosine similarity.
//
// Uses raw SQL (prisma.$executeRaw) because Prisma does not natively
// support the pgvector column type — the `embedding` column is declared
// as Unsupported("vector(1536)") in the schema.
//
// The INSERT uses ON CONFLICT to handle cases where the message was
// already embedded (e.g. on regenerate), updating in place rather
// than throwing a unique constraint error.
export const storeMessageEmbedding = async (input) => {
    const { messageId, chatId, content, role } = input;
    try {
        const embedding = await generateEmbedding(content);
        await prisma.$executeRaw `
      INSERT INTO "MessageEmbedding" (
        id,
        "messageId",
        "chatId",
        content,
        embedding,
        role,
        "createdAt"
      )
      VALUES (
        gen_random_uuid()::text,
        ${messageId},
        ${chatId},
        ${content},
        ${embedding}::vector,
        ${role}::"MessageRole",
        NOW()
      )
      ON CONFLICT ("messageId")
      DO UPDATE SET
        embedding = ${embedding}::vector,
        content   = ${content}
    `;
        logger.info("Message embedding stored", {
            messageId,
            chatId,
            role,
            contentLength: content.length,
        });
    }
    catch (error) {
        logger.error("Failed to store message embedding", {
            error,
            messageId,
            chatId,
        });
    }
};
