import { pineconeIndex } from "../../configs/pinecone/pineconeClient.js";
export const storeAiChatKnowledge = async ({ id, normalizedQuery, normalizedQueryEmbedding, assistantResponse, chatId, userMessageId, model, regenerateCount, }) => {
    await pineconeIndex.upsert([
        {
            id,
            values: normalizedQueryEmbedding, // searchable vector
            metadata: {
                normalizedQuery,
                assistantResponse,
                chatId,
                userMessageId,
                model,
                regenerateCount,
                createdAt: Date.now(),
            },
        },
    ]);
};
export const searchAiChatKnowledge = async (embedding, limit, chatId) => {
    const result = await pineconeIndex.query({
        vector: embedding,
        topK: limit,
        includeMetadata: true,
        filter: {
            chatId: { $eq: chatId },
        },
    });
    return (result.matches?.map((match) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata,
    })) ?? []);
};
