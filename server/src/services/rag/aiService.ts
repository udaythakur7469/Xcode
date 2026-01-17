import logger from "../../configs/loggerConfig.js";
import { calculateContextSize } from "./contextSizeCalculation.js";
import { generateEmbedding } from "./embeddings.js";
import { filterDocuments } from "./filter.js";
import { normalizeAiResponse } from "./normalize.js";
import { searchChatKnowledge } from "./pineconeService.js";
import { getOrUpdateRegenerateState } from "./setRegenerateState.js";
import { topicShiftDetection } from "./topicShiftDetection.js";
import {
  FilterResult,
  GenerateAIResponseParams,
  RetrievedKnowledge,
} from "./types.js";
import { fetchPreviousUserMessages } from "./userMessages.js";

export const generateAIResponse = async (
  params: GenerateAIResponseParams
): Promise<string> => {
  const {
    chatId,
    userMessageId,
    currentUserMessage,
    regenerate,
    aiModel,
    lastMessageModel,
  } = params;

  const PROBE_CONTEXT_SIZE = 5;
  let contextSize = 0;

  // Step 1: Get or update regenerate state
  const { regenerateCount, aiModelChanged } = await getOrUpdateRegenerateState(
    chatId,
    userMessageId,
    regenerate,
    aiModel,
    lastMessageModel
  );

  const probeUserMessages = await fetchPreviousUserMessages(
    chatId,
    PROBE_CONTEXT_SIZE
  );

  const topicShiftDetected = await topicShiftDetection({
    userMessage: currentUserMessage,
    previousMessages: probeUserMessages,
  });

  if (topicShiftDetected.strategy === "RESET") {
    contextSize = 0;
  }

  if (topicShiftDetected.strategy === "FULL") {
    contextSize = calculateContextSize(regenerateCount, aiModelChanged);
  }

  if (topicShiftDetected.strategy === "PARTIAL") {
    contextSize = Math.max(
      0,
      calculateContextSize(regenerateCount, aiModelChanged) - 2
    );
  }

  // Step 3: Fetch previous user messages for context
  const previousUserMessages = await fetchPreviousUserMessages(
    chatId,
    contextSize
  );

  console.log(`[generateAIResponse] Debug info:`, {
    regenerateCount,
    aiModelChanged,
    contextSize,
    previousMessagesCount: previousUserMessages.length,
  });

  // Step 4: Normalize the message
  const normalizedMessage = await normalizeAiResponse({
    currentUserMessage,
    previousUserMessages,
    regenerate,
    aiModelChanged,
  });

  // Step 5: Embed the normalized message
  const embeddedNormalizedMessage: number[] = await generateEmbedding(
    normalizedMessage
  );

  // Step 6: Search Pinecone for relevant past knowledge
  const retrievedKnowledge: RetrievedKnowledge[] = await searchChatKnowledge(
    embeddedNormalizedMessage,
    contextSize,
    chatId
  );

  console.log("[generateAIResponse] Retrieved knowledge:", retrievedKnowledge);

  // Step 7: Filter retrieved documents
  const filteredDocuments: FilterResult = await filterDocuments(
    retrievedKnowledge,
    0.75
  );

  console.log("[generateAIResponse] filtered documents:", filteredDocuments);

  const response = `AI Response (using ${aiModel}) to normalized message: "${normalizedMessage}"`;

  return response;
};
