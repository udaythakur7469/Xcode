import { calculateContextSize } from "./contextSizeCalculation.js";
import { generateEmbedding } from "./embeddings.js";
import { filterDocuments } from "./filter.js";
import { normalizeAiResponse } from "./normalize.js";
import { searchChatKnowledge } from "./pineconeService.js";
import { getOrUpdateRegenerateState } from "./setRegenerateState.js";
import { fetchPreviousUserMessages } from "./userMessages.js";
export const generateAIResponse = async (params) => {
    const { chatId, userMessageId, currentUserMessage, regenerate, aiModel, lastMessageModel, } = params;
    // Step 1: Get or update regenerate state
    const { regenerateCount, aiModelChanged } = await getOrUpdateRegenerateState(chatId, userMessageId, regenerate, aiModel, lastMessageModel);
    // Step 2: Calculate context size
    const contextSize = calculateContextSize(regenerateCount, aiModelChanged);
    // Step 3: Fetch previous user messages for context
    const previousUserMessages = await fetchPreviousUserMessages(chatId, contextSize);
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
    const embeddedNormalizedMessage = await generateEmbedding(normalizedMessage);
    // Step 6: Search Pinecone for relevant past knowledge
    const retrievedKnowledge = await searchChatKnowledge(embeddedNormalizedMessage, contextSize, chatId);
    console.log("[generateAIResponse] Retrieved knowledge:", retrievedKnowledge);
    // Step 7: Filter retrieved documents
    const filteredDocuments = await filterDocuments(retrievedKnowledge, 0.75);
    console.log("[generateAIResponse] filtered documents:", filteredDocuments);
    const response = `AI Response (using ${aiModel}) to normalized message: "${normalizedMessage}"`;
    return response;
};
