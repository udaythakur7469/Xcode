import { pineconeIndex } from "../../configs/pinecone/pineconeClient.js";
import { ChatKnowledgeMetadata, RetrievedKnowledge, StoreAiChatKnowledgeParams } from "./types.js";

export const storeAiChatKnowledge = async ({
  id,
  normalizedQuery,
  normalizedQueryEmbedding,
  assistantResponse,
  chatId,
  userMessageId,
  model,
  regenerateCount,
  userId,
}: StoreAiChatKnowledgeParams) => {
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
        userId,
        createdAt: Date.now(),
      },
    },
  ]);
};

export const searchAiChatKnowledge = async (
  embedding: number[],
  limit: number,
  chatId: string,
  namespace?: string,
  userId?: number,
): Promise<RetrievedKnowledge[]> => {
  const index = namespace ? pineconeIndex.namespace(namespace) : pineconeIndex;

  const queryParams: any = {
    vector: embedding,
    topK: limit,
    includeMetadata: true,
    filter: namespace
      ? undefined // shared namespaces: no filter
      : { chatId: { $eq: chatId } }, // default: filter by chatId
  };

  // On default namespace, also scope by userId if provided (cross-chat memory)
  if (userId && !namespace) {
    queryParams.filter = { userId: { $eq: userId } };
  }

  const result = await index.query(queryParams);

  return (
    result.matches?.map((match) => ({
      id: match.id,
      score: match.score,
      metadata: match.metadata as unknown as ChatKnowledgeMetadata,
    })) ?? []
  );
};
