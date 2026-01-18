import logger from "../../configs/loggerConfig.js";
import { calculateContextSize } from "./contextSizeCalculation.js";
import { missingArtifactsDetector } from "./detectMissingArtifacts.js";
import { generateEmbedding } from "./embeddings.js";
import { filterDocuments } from "./filter.js";
import { userExpectationChecker } from "./inferUserExpectation.js";
import { extractCodeFromMessage } from "./messageCodeExtractor.js";
import { normalizeAiResponse } from "./normalize.js";
import { searchAiChatKnowledge } from "./pineconeService.js";
import { solutionIntentProcessor } from "./processSolutionIntent.js";
import { getOrUpdateRegenerateState } from "./setRegenerateState.js";
import { topicShiftDetection } from "./topicShiftDetection.js";
import { fetchPreviousUserMessages } from "./userMessages.js";
export const generateAIResponse = async (params) => {
    const { chatId, userMessageId, currentUserMessage, regenerate, aiModel, lastMessageModel, userId, problemTitle, } = params;
    const PROBE_CONTEXT_SIZE = 5;
    let contextSize = 0;
    // Step 1: Get or update regenerate state
    const { regenerateCount, aiModelChanged } = await getOrUpdateRegenerateState(chatId, userMessageId, regenerate, aiModel, lastMessageModel);
    const probeUserMessages = await fetchPreviousUserMessages(chatId, PROBE_CONTEXT_SIZE);
    // Extract code from message if present
    const providedCode = extractCodeFromMessage(currentUserMessage);
    console.log("[generateAIResponse] Extracted code:", {
        hasCode: !!providedCode,
        codeLength: providedCode?.length || 0,
    });
    // User expectation check (runs independently)
    try {
        const expectationCheck = userExpectationChecker({
            userMessage: currentUserMessage,
            normalizedQuery: currentUserMessage.toLowerCase(),
            providedCode,
        });
        console.log("[generateAIResponse] User expectation check:", expectationCheck);
        // Block if user expects implicit access
        if (expectationCheck.shouldBlock) {
            console.log("[generateAIResponse] Blocked - user expects implicit access:", expectationCheck.expectedResource);
            logger.info("Request blocked - implicit access expectation", {
                userId,
                problemTitle,
                expectedResource: expectationCheck.expectedResource,
            });
            return (expectationCheck.clarificationMessage ||
                "Please paste your code here so I can analyze it.");
        }
    }
    catch (error) {
        console.error("[generateAIResponse] User expectation check failed:", error);
        // Non-critical error - continue with pipeline
    }
    let permissions = null;
    console.log("[generateAIResponse] Running solution intent processor");
    try {
        const processorResult = await solutionIntentProcessor(userId, problemTitle, currentUserMessage, probeUserMessages);
        permissions = processorResult.permissions;
        if (processorResult.shouldBlock) {
            console.log("[generateAIResponse] Request blocked by solution intent gate");
            // Log for analytics
            logger.info("Solution request blocked", {
                userId,
                problemTitle,
                intent: processorResult.intent,
                refusalLevel: processorResult.permissions.refusalLevel,
                attemptCount: "tracked in DB",
            });
            return (processorResult.blockMessage ||
                "I can't provide the solution before you solve the problem yourself.");
        }
        console.log("[generateAIResponse] Solution processor passed with permissions:", permissions);
        try {
            const artifactCheck = await missingArtifactsDetector({
                userMessage: currentUserMessage,
                normalizedQuery: currentUserMessage.toLowerCase(),
                detectedIntent: processorResult.intent,
                providedCode,
                providedError: null, // You can extract from message if needed
                providedTestCase: null, // You can extract from message if needed
            });
            console.log("[generateAIResponse] Artifact check result:", artifactCheck);
            // Block if artifacts missing
            if (artifactCheck.blockGeneration) {
                console.log("[generateAIResponse] Blocked - missing artifacts:", artifactCheck.missingArtifacts);
                logger.info("Request blocked - missing artifacts", {
                    userId,
                    problemTitle,
                    missingArtifacts: artifactCheck.missingArtifacts,
                    intent: processorResult.intent,
                });
                return (artifactCheck.requestMessage ||
                    "Please provide your code so I can help you accurately.");
            }
        }
        catch (error) {
            console.error("[generateAIResponse] Artifact detection failed:", error);
            logger.error("Artifact detection error", {
                error,
                userId,
                problemTitle,
            });
            // Fail-safe: ask for code to prevent hallucination
            return "I'll need your code to help you with this. Please paste it here.";
        }
        logger.info("Solution gate passed", {
            userId,
            problemTitle,
            intent: processorResult.intent,
            permissions: {
                mode: permissions.solutionPermissionMode,
                refusalLevel: permissions.refusalLevel,
                maxHintLevel: permissions.maxHintLevel,
                editorialAccess: permissions.editorialAccessTier,
            },
        });
    }
    catch (error) {
        console.error("[generateAIResponse] Solution gate error:", error);
        logger.error("Solution intent gate failed", {
            error,
            userId,
            problemTitle,
        });
        // Return error message instead of potentially leaking solution
        return "I encountered an error processing your request. Please try again.";
    }
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
        contextSize = Math.max(0, calculateContextSize(regenerateCount, aiModelChanged) - 2);
    }
    // Step 3: Fetch previous user messages for context
    const previousUserMessages = await fetchPreviousUserMessages(chatId, contextSize);
    console.log(`[generateAIResponse] Debug info:`, {
        regenerateCount,
        aiModelChanged,
        contextSize,
        previousMessagesCount: previousUserMessages.length,
        topicShiftDetected: topicShiftDetected.strategy,
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
    const retrievedKnowledge = await searchAiChatKnowledge(embeddedNormalizedMessage, contextSize, chatId);
    console.log("[generateAIResponse] Retrieved knowledge:", retrievedKnowledge);
    // Step 7: Filter retrieved documents
    const filteredDocuments = await filterDocuments(retrievedKnowledge, 0.75);
    console.log("[generateAIResponse] filtered documents:", filteredDocuments);
    const response = `AI Response (using ${aiModel}) to normalized message: "${normalizedMessage}"`;
    return response;
};
