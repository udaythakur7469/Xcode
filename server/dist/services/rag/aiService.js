import logger from "../../configs/loggerConfig.js";
import prisma from "../../configs/db.js";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
// ── Existing modules (unchanged files) ───────────────────────────────────────
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
// ── All types ─────────────────────────────────────────────────────────────────
import { EditorialAccessTier, HintLevel, RefusalLevel, SolutionPermissionMode, } from "./types.js";
// ── Phase 1 — Unified intent router ──────────────────────────────────────────
import { unifiedIntentRouter } from "./unifiedIntentRouter.js";
// ── Phase 1.5 — Interview intent ──────────────────────────────────────────────
import { detectInterviewIntent } from "./interviewIntentHandler.js";
// ── Phase 1.7 — General intent ────────────────────────────────────────────────
import { detectGeneralIntent } from "./generalIntentRouter.js";
import { fetchPersonalData } from "./personalDataFetcher.js";
import { fetchContentData } from "./contentQueryFetcher.js";
import { assembleGeneralResponse } from "./generalResponseAssembler.js";
// ── Phase 2B/2C blocks — Denial system ───────────────────────────────────────
import { buildDenialContext } from "./buildDenialContext.js";
import { generateDenialResponse } from "./denialResponseGenerator.js";
// ── Phase 4-5 — Memory: reference detection + context strategy ───────────────
import { detectLongRangeReference } from "./detectLongRangeReference.js";
import { decideContextStrategy } from "./decideContextStrategy.js";
// ── Phase 6-7 — Memory: persistent summary ───────────────────────────────────
import { archiveAndResetSummaryOnTopicChange, fetchConversationSummary, shouldUpdateSummary, updateConversationSummary, } from "./conversationSummaryManager.js";
// ── Phase 11 + 18A — Semantic backtracking + embedding store ─────────────────
import { findRelevantPastMessages } from "./findRelevantPastMessages.js";
import { storeMessageEmbedding } from "./storeMessageEmbedding.js";
// ── Phase 10b — Tier-2 regenerate strategy ───────────────────────────────────
import { buildRegenerateStrategy } from "./regenerateFallback.js";
// ── Phase 14b — Tier-1 automatic retry ───────────────────────────────────────
import { runAutoRetrievalRetry, AUTO_RETRY_CONFIDENCE_THRESHOLD, } from "./retrievalRetry.js";
// ── Phase 15-17 — Generation, scoring, assembly ──────────────────────────────
import { answerGeneration } from "./answerGeneration.js";
import { answerConfidenceScorer } from "./answerConfidenceScorer.js";
import { responseAssembler } from "./responseAssembler.js";
// ============================================================
// PIPELINE CONSTANTS
// ============================================================
const PROBE_CONTEXT_SIZE = 5;
const SEMANTIC_BACKTRACK_LIMIT = 3;
const SEMANTIC_SIMILARITY_THRESHOLD = 0.75;
const DEFAULT_PINECONE_TOP_K = 5;
const DEFAULT_PINECONE_FILTER_THRESHOLD = 0.75;
// Bypass permissions for RAG-bypass path (greetings etc.)
const BYPASS_PERMISSIONS = {
    solutionPermissionMode: SolutionPermissionMode.ALLOW_FULL_SOLUTION,
    refusalLevel: RefusalLevel.SOFT,
    maxHintLevel: HintLevel.NONE,
    editorialAccessTier: EditorialAccessTier.NONE,
};
// Fallbacks for Phase 1 bypass acknowledgement via LLM
const BYPASS_FALLBACKS = {
    GREETING: "I'm here and ready to help! Feel free to paste your code or describe what you're working on.",
    PING: "Got it! What would you like to work on?",
    META: "I'm an AI coding assistant for Xcode. I can help you debug, explain concepts, review approaches, and guide you through problems without just giving away the answer.",
};
// ============================================================
// MAIN EXPORT
// ============================================================
export const generateAIResponse = async (params) => {
    const { chatId, userMessageId, currentUserMessage, regenerate, aiModel, lastMessageModel, userId, problemTitle, problemId, userSolved, activePath, isBranch = false, } = params;
    // ================================================================
    // PHASE 0: REGENERATE STATE
    //
    // Reads or creates the RegenerateState row.
    // Returns regenerateCount, aiModelChanged, and
    // lastRetrievalConfidence (from previous run, for Tier-2 strategy).
    // ================================================================
    const { regenerateCount, aiModelChanged, lastRetrievalConfidence } = await getOrUpdateRegenerateState(chatId, userMessageId, regenerate, aiModel, lastMessageModel);
    // Probe fetch — fixed 5-message window for Phase 1, 2, and 3
    const probeUserMessages = await fetchPreviousUserMessages({
        activePath,
        limit: PROBE_CONTEXT_SIZE,
    });
    const providedCode = extractCodeFromMessage(currentUserMessage);
    logger.info("Pipeline: started", {
        chatId,
        userId,
        problemTitle,
        aiModel,
        regenerate,
        regenerateCount,
        aiModelChanged,
        lastRetrievalConfidence,
        hasCode: providedCode !== null,
    });
    // ================================================================
    // PHASE 1: UNIFIED INTENT ROUTER
    //
    // Pure non-task messages ("Hi", "ok", "thanks") → bypass pipeline.
    // Mixed intent ("Hey! Can you debug this?") → split into prefix + task.
    // Pure task → full pipeline unchanged.
    // ================================================================
    const intentRoute = await unifiedIntentRouter({
        userMessage: currentUserMessage,
        probeUserMessages,
        problemTitle,
    });
    if (intentRoute.shouldBypassRAG) {
        logger.info("Pipeline: RAG bypassed — pure non-task message", {
            userId,
            problemTitle,
            detectedPattern: intentRoute.detectedPattern,
        });
        // Phase 1 bypass: use LLM for a contextual acknowledgement
        let bypassRawAnswer = BYPASS_FALLBACKS[intentRoute.detectedPattern ?? "GREETING"] ??
            BYPASS_FALLBACKS.GREETING;
        try {
            const { text } = await generateText({
                model: google("gemini-2.5-flash"),
                temperature: 0.9,
                maxTokens: 60,
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful AI coding assistant on Xcode. The user sent a non-task message.
Respond naturally in 1-2 sentences. Be warm and brief. Don't ask multiple questions.
Context: problem "${problemTitle ?? "none"}", pattern "${intentRoute.detectedPattern}".`,
                    },
                    { role: "user", content: currentUserMessage },
                ],
            });
            bypassRawAnswer = text.trim() || bypassRawAnswer;
        }
        catch (err) {
            logger.error("Phase 1 bypass: Gemini call failed — using fallback", {
                err,
            });
        }
        const bypassResult = await responseAssembler({
            rawAnswer: bypassRawAnswer,
            prefixSegment: intentRoute.prefixSegment,
            permissions: BYPASS_PERMISSIONS,
            overallConfidence: 1.0,
            injectConfidenceMetadata: false,
            generationSucceeded: true,
            problemTitle,
        });
        return bypassResult.finalResponse;
    }
    const activeMessage = intentRoute.isMixedIntent && intentRoute.taskSegment !== null
        ? intentRoute.taskSegment
        : currentUserMessage;
    // ================================================================
    // PHASE 1.5: INTERVIEW INTENT DETECTION
    //
    // Detects if the user is asking about mock interviews, prep,
    // verdicts, feedback scores, or platform interview feature.
    // Routes Pinecone retrieval to "interview-knowledge" namespace.
    // ================================================================
    const interviewIntent = await detectInterviewIntent(activeMessage);
    const isInterviewQuery = interviewIntent.isInterviewQuery && interviewIntent.confidence > 0.4;
    if (isInterviewQuery) {
        logger.info("Pipeline: interview intent detected", {
            subIntent: interviewIntent.subIntent,
            confidence: interviewIntent.confidence,
            extractedRole: interviewIntent.extractedRole,
        });
    }
    // ================================================================
    // PHASE 1.7: GENERAL INTENT DETECTION
    //
    // Detects greetings, general CS questions, platform how-to,
    // personal data queries (my submissions, stats, sticky notes, posts)
    // and content queries (problem posts, test cases, stats).
    //
    // When matched: short-circuits entire RAG pipeline.
    // ================================================================
    const generalIntent = await detectGeneralIntent(activeMessage);
    const isGeneralQuery = generalIntent.isGeneralQuery && generalIntent.confidence > 0.45;
    if (isGeneralQuery) {
        logger.info("Pipeline: general intent detected — short-circuiting", {
            intent: generalIntent.intent,
            confidence: generalIntent.confidence,
        });
        let dbResult = null;
        if (generalIntent.requiresDbLookup) {
            const isPersonalIntent = [
                "MY_SUBMISSIONS",
                "MY_STATS",
                "MY_STICKY_NOTES",
                "MY_POSTS",
                "MY_COMMENTS",
                "MY_INTERVIEW_HISTORY",
                "MY_PROFILE",
            ].includes(generalIntent.intent);
            if (isPersonalIntent) {
                dbResult = await fetchPersonalData({
                    userId,
                    intent: generalIntent.intent,
                    extractedProblemTitle: generalIntent.extractedProblemTitle,
                    extractedKeyword: generalIntent.extractedKeyword,
                    userMessage: activeMessage,
                });
            }
            else {
                dbResult = await fetchContentData({
                    intent: generalIntent.intent,
                    extractedProblemTitle: generalIntent.extractedProblemTitle,
                    extractedPostId: generalIntent.extractedPostId,
                    userMessage: activeMessage,
                    currentProblemId: problemId,
                });
            }
        }
        let pineconeContext;
        if (generalIntent.intent === "PLATFORM_FEATURE") {
            try {
                const platformEmbedding = await generateEmbedding(activeMessage);
                const platformDocs = await searchAiChatKnowledgeWithNamespace(platformEmbedding, 3, chatId, "platform-features");
                pineconeContext = platformDocs
                    .map((d) => d.metadata?.assistantResponse ?? "")
                    .join("\n\n");
            }
            catch (err) {
                logger.warn("Pipeline: platform Pinecone search failed", { err });
            }
        }
        // Fetch user name for greeting personalization
        let userName;
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true },
            });
            userName = user?.name ?? undefined;
        }
        catch { }
        const generalResponse = await assembleGeneralResponse({
            intent: generalIntent.intent,
            userMessage: activeMessage,
            dbResult,
            pineconeContext,
            userName,
        });
        if (generalResponse.shortCircuit) {
            return generalResponse.response;
        }
    }
    // ================================================================
    // PHASE 2A: USER EXPECTATION CHECK (guarded for non-general, non-interview)
    //
    // Blocks when user references code they expect AI to have but didn't paste.
    // ================================================================
    if (!isInterviewQuery && !isGeneralQuery) {
        try {
            const expectationCheck = userExpectationChecker({
                userMessage: activeMessage,
                normalizedQuery: activeMessage.toLowerCase(),
                providedCode,
            });
            if (expectationCheck.shouldBlock) {
                logger.info("Pipeline: blocked — implicit access expectation", {
                    userId,
                    problemTitle,
                    expectedResource: expectationCheck.expectedResource,
                });
                return (expectationCheck.clarificationMessage ||
                    "Please paste your code here so I can analyze it.");
            }
        }
        catch (error) {
            logger.error("Phase 2A: expectation check threw — continuing", {
                error,
                userId,
                problemTitle,
            });
        }
    }
    // ================================================================
    // PHASE 2B: SOLUTION INTENT GATE (guarded)
    //
    // Classifies intent, builds PermissionContext.
    // Blocks with denial response if user tries to get solution too early.
    // ================================================================
    let permissions = null;
    let detectedIntent = null;
    let intentConfidence = 0;
    if (!isInterviewQuery && !isGeneralQuery) {
        try {
            const processorResult = await solutionIntentProcessor(userId, problemTitle, activeMessage, probeUserMessages);
            permissions = processorResult.permissions;
            detectedIntent = processorResult.intent;
            intentConfidence = processorResult.confidence ?? 0.8;
            if (processorResult.shouldBlock) {
                logger.info("Pipeline: blocked — solution intent gate", {
                    userId,
                    problemTitle,
                    intent: processorResult.intent,
                });
                // Use denial system for dynamic refusal messages
                if (problemId) {
                    try {
                        const denialCtx = await buildDenialContext({
                            userId,
                            problemId,
                            intentConfidence: processorResult.confidence ?? 0.8,
                            isNewTopic: false,
                            userSolved: userSolved ?? false,
                            denialReason: "REQUESTED_FULL_SOLUTION_UNSOLVED",
                            refusalLevel: processorResult.permissions?.refusalLevel ?? RefusalLevel.SOFT,
                            solutionAttemptCount: 0,
                        });
                        const denialResult = await generateDenialResponse(denialCtx);
                        return denialResult.message;
                    }
                    catch (err) {
                        logger.error("Phase 2B denial generation failed", { err });
                    }
                }
                return (processorResult.blockMessage ||
                    "I can't provide the solution before you solve the problem yourself.");
            }
            // ================================================================
            // PHASE 2C: MISSING ARTIFACT GATE (guarded)
            // ================================================================
            try {
                const artifactCheck = await missingArtifactsDetector({
                    userMessage: activeMessage,
                    normalizedQuery: activeMessage.toLowerCase(),
                    detectedIntent: processorResult.intent,
                    providedCode,
                    providedError: null,
                    providedTestCase: null,
                });
                if (artifactCheck.blockGeneration) {
                    logger.info("Pipeline: blocked — missing artifacts", {
                        userId,
                        problemTitle,
                        missingArtifacts: artifactCheck.missingArtifacts,
                    });
                    if (problemId) {
                        try {
                            const denialCtx = await buildDenialContext({
                                userId,
                                problemId,
                                intentConfidence: processorResult.confidence ?? 0.8,
                                isNewTopic: false,
                                userSolved: userSolved ?? false,
                                denialReason: "MISSING_REQUIRED_ARTIFACTS",
                                refusalLevel: processorResult.permissions?.refusalLevel ??
                                    RefusalLevel.SOFT,
                                solutionAttemptCount: 0,
                            });
                            const denialResult = await generateDenialResponse(denialCtx);
                            return denialResult.message;
                        }
                        catch (err) {
                            logger.error("Phase 2C denial generation failed", { err });
                        }
                    }
                    return (artifactCheck.requestMessage ||
                        "Please provide your code so I can help you accurately.");
                }
            }
            catch (error) {
                logger.error("Phase 2C: artifact detection threw — fail-safe return", {
                    error,
                    userId,
                    problemTitle,
                });
                return "I'll need your code to help with this. Please paste it here.";
            }
            logger.info("Pipeline: safety gates passed", {
                userId,
                problemTitle,
                intent: processorResult.intent,
                permissionMode: permissions.solutionPermissionMode,
            });
        }
        catch (error) {
            logger.error("Phase 2B: solution intent gate threw", {
                error,
                userId,
                problemTitle,
            });
            return "I encountered an error processing your request. Please try again.";
        }
    }
    else {
        // For interview/general queries that reach this point,
        // use permissive defaults so generation proceeds normally
        permissions = BYPASS_PERMISSIONS;
        detectedIntent = "PARTIAL_HELP";
        intentConfidence = 0.8;
    }
    // ================================================================
    // PHASE 3: TOPIC SHIFT DETECTION
    // ================================================================
    const topicShiftResult = await topicShiftDetection({
        userMessage: activeMessage,
        previousMessages: probeUserMessages,
    });
    // ================================================================
    // PHASE 4: LONG-RANGE REFERENCE DETECTION (~0ms, regex only)
    // ================================================================
    const longRangeRef = detectLongRangeReference(activeMessage);
    // ================================================================
    // PHASE 5: CONTEXT STRATEGY DECISION
    //
    // Replaces calculateContextSize. Returns:
    //   recentMessageCount          — how many messages to load
    //   includeConversationSummary  — whether to fetch summary
    //   enableSemanticBacktracking  — whether to run pgvector search
    // ================================================================
    const contextStrategy = decideContextStrategy({
        topicShiftStrategy: topicShiftResult.strategy,
        hasLongRangeReference: longRangeRef.hasLongRangeReference,
        longRangeConfidence: longRangeRef.confidence,
        regenerateCount,
        aiModelChanged,
    });
    logger.info("Pipeline: context strategy decided", {
        chatId,
        strategy: contextStrategy.strategy,
        recentMessageCount: contextStrategy.recentMessageCount,
        includeConversationSummary: contextStrategy.includeConversationSummary,
        enableSemanticBacktracking: contextStrategy.enableSemanticBacktracking,
        explanation: contextStrategy.explanation,
    });
    // ================================================================
    // PHASE 6: SUMMARY ARCHIVE ON TOPIC RESET (background)
    // ================================================================
    // Derive current leaf once — used by Phase 6, 7, and 18B
    const currentLeaf = activePath[activePath.length - 1] ?? userMessageId; // ADD
    if (topicShiftResult.strategy === "RESET") {
        archiveAndResetSummaryOnTopicChange(chatId, currentLeaf).catch((err) => logger.error("Phase 6: failed to archive summary on topic reset", {
            err,
            chatId,
        }));
    }
    // ================================================================
    // PHASE 7: FETCH CONVERSATION SUMMARY (conditional)
    // ================================================================
    let conversationSummary = null;
    if (contextStrategy.includeConversationSummary) {
        const summaryResult = await fetchConversationSummary(chatId, currentLeaf); // CHANGED: added currentLeaf
        conversationSummary = summaryResult.summary;
        logger.info("Pipeline: conversation summary fetched", {
            chatId,
            currentLeaf, // ADD to log
            hasSummary: conversationSummary !== null,
            summaryLength: conversationSummary !== null ? conversationSummary.length : 0,
        });
    }
    // ================================================================
    // PHASE 8: FETCH RECENT MESSAGES
    // ================================================================
    const previousUserMessages = await fetchPreviousUserMessages({
        activePath,
        limit: contextStrategy.recentMessageCount,
    });
    // ================================================================
    // PHASE 9: NORMALIZE MESSAGE
    // ================================================================
    const normalizedMessage = await normalizeAiResponse({
        currentUserMessage: activeMessage,
        previousUserMessages,
        regenerate,
        aiModelChanged,
    });
    // ================================================================
    // PHASE 10: EMBED NORMALIZED MESSAGE
    //
    // originalEmbedding is always used for pgvector backtracking.
    // activeEmbedding may be replaced by Tier-2 expanded query.
    // ================================================================
    const originalEmbedding = await generateEmbedding(normalizedMessage);
    // ================================================================
    // PHASE 10b: TIER-2 REGENERATE OPTIONS OVERRIDE (conditional)
    //
    // < 0.40  → COMPREHENSIVE  (expanded query + topK 15 + threshold 0.60)
    // 0.40-0.59 → MORE_DOCUMENTS (topK 10 + threshold 0.65)
    // ≥ 0.60  → EXPAND_QUERY   (enriched query + topK 10 + regenerateMode)
    // ================================================================
    let activeTopK = DEFAULT_PINECONE_TOP_K;
    let activeFilterThreshold = DEFAULT_PINECONE_FILTER_THRESHOLD;
    let activeEmbedding = originalEmbedding;
    let regenerateMode = false;
    let tier2Strategy = null;
    if (regenerate) {
        const regenStrategy = buildRegenerateStrategy({
            normalizedMessage,
            chatId,
            userId,
            problemTitle,
            previousRetrievalConfidence: lastRetrievalConfidence,
        });
        tier2Strategy = regenStrategy.strategy;
        activeTopK = regenStrategy.retrievalOptions.topK;
        activeFilterThreshold = regenStrategy.retrievalOptions.similarityThreshold;
        if (regenStrategy.retrievalOptions.expandedQuery !== null) {
            activeEmbedding = await generateEmbedding(regenStrategy.retrievalOptions.expandedQuery);
        }
        regenerateMode =
            regenStrategy.strategy === "EXPAND_QUERY" ||
                regenStrategy.strategy === "COMPREHENSIVE";
        logger.info("Pipeline: Tier-2 regenerate options applied", {
            chatId,
            strategy: tier2Strategy,
            topK: activeTopK,
            filterThreshold: activeFilterThreshold,
            embeddingExpanded: regenStrategy.retrievalOptions.expandedQuery !== null,
            regenerateMode,
        });
    }
    // ================================================================
    // PHASE 11: SEMANTIC BACKTRACKING (conditional)
    //
    // Only fires when contextStrategy.enableSemanticBacktracking === true.
    // Always uses originalEmbedding (not Tier-2 expanded).
    // ================================================================
    let relevantPastMessages = [];
    if (contextStrategy.enableSemanticBacktracking) {
        relevantPastMessages = await findRelevantPastMessages({
            chatId,
            activePath,
            currentEmbedding: originalEmbedding,
            excludeRecentCount: contextStrategy.recentMessageCount,
            limit: SEMANTIC_BACKTRACK_LIMIT,
            similarityThreshold: SEMANTIC_SIMILARITY_THRESHOLD,
        });
        logger.info("Pipeline: semantic backtracking complete", {
            chatId,
            retrievedCount: relevantPastMessages.length,
        });
    }
    // ================================================================
    // PHASE 12: ASSEMBLE CONTEXT
    // ================================================================
    const assembledContext = {
        summary: conversationSummary,
        relevantPastMessages,
        recentMessages: previousUserMessages,
    };
    // ================================================================
    // PHASE 13: PINECONE RAG SEARCH
    //
    // Namespace routing:
    //   isInterviewQuery → "interview-knowledge"
    //   PLATFORM_FEATURE  → "platform-features"
    //   default           → undefined (coding problems)
    // ================================================================
    const pineconeNamespace = isInterviewQuery
        ? "interview-knowledge"
        : isGeneralQuery && generalIntent.intent === "PLATFORM_FEATURE"
            ? "platform-features"
            : undefined;
    // userId filter only on default namespace (shared namespaces have no per-user data)
    const retrievedKnowledge = await searchAiChatKnowledgeWithNamespace(activeEmbedding, activeTopK, chatId, pineconeNamespace, pineconeNamespace ? undefined : userId);
    // ================================================================
    // PHASE 14: FILTER DOCUMENTS
    // ================================================================
    const initialFilterResult = await filterDocuments(retrievedKnowledge, activeFilterThreshold);
    logger.info("Pipeline: initial retrieval complete", {
        chatId,
        retrievedCount: retrievedKnowledge.length,
        filteredCount: initialFilterResult.docs.length,
        retrievalConfidence: initialFilterResult.retrievalConfidence,
        tier2Active: regenerate,
        namespace: pineconeNamespace ?? "default",
    });
    // ================================================================
    // PHASE 14b: TIER-1 AUTOMATIC RETRIEVAL RETRY (conditional)
    //
    // Invisible to user. Fires when retrievalConfidence < 0.55.
    // Attempt 1 → EXPAND_QUERY (deterministic, ~0ms)
    // Attempt 2 → MORE_DOCUMENTS (topK 10, threshold 0.65)
    // Always keeps best result.
    // ================================================================
    let filteredDocuments = initialFilterResult;
    let finalEmbedding = activeEmbedding;
    let finalNormalizedQuery = normalizedMessage;
    let tier1Fired = false;
    let tier1AttemptCount = 0;
    if (initialFilterResult.retrievalConfidence < AUTO_RETRY_CONFIDENCE_THRESHOLD) {
        logger.info("Pipeline: Tier-1 auto retry triggered", {
            chatId,
            retrievalConfidence: initialFilterResult.retrievalConfidence,
            threshold: AUTO_RETRY_CONFIDENCE_THRESHOLD,
        });
        const retryResult = await runAutoRetrievalRetry({
            initialFilterResult,
            initialEmbedding: activeEmbedding,
            normalizedMessage,
            chatId,
            problemTitle,
        });
        filteredDocuments = retryResult.finalFilterResult;
        finalEmbedding = retryResult.finalEmbedding;
        finalNormalizedQuery = retryResult.finalNormalizedQuery;
        tier1Fired = retryResult.retriesFired > 0;
        tier1AttemptCount = retryResult.attempts.length;
        logger.info("Pipeline: Tier-1 auto retry complete", {
            chatId,
            retriesFired: retryResult.retriesFired,
            finalRetrievalConfidence: filteredDocuments.retrievalConfidence,
            queryExpanded: finalNormalizedQuery !== normalizedMessage,
        });
    }
    // ================================================================
    // PHASE 15: ANSWER GENERATION
    //
    // Builds system prompt (permission directives, summary, regenerate
    // depth instruction) and user prompt (backtracked msgs, recent msgs,
    // knowledge base context, question).
    // Real Gemini Flash call.
    // ================================================================
    const generationResult = await answerGeneration({
        normalizedMessage: finalNormalizedQuery,
        filteredDocuments,
        permissions: permissions,
        intent: detectedIntent,
        assembledContext,
        problemTitle,
        aiModel,
        regenerateMode,
    });
    // ================================================================
    // PHASE 16: CONFIDENCE SCORING
    //
    // Weighted score from 5 signals:
    //   retrievalConfidence × 30%
    //   intentConfidence    × 25%
    //   artifactConfidence  × 20%
    //   topicSimilarity     × 15%
    //   regeneratePenalty   × 10%
    //
    // Permission caps: DENY+STRICT ≤ 0.50, DENY ≤ 0.60, HINTS ≤ 0.80.
    // ================================================================
    const confidenceResult = await answerConfidenceScorer({
        retrievalConfidence: filteredDocuments.retrievalConfidence,
        intentConfidence,
        artifactConfidence: 0.9,
        topicSimilarityScore: topicShiftResult.similarityScore,
        permissions: permissions,
        regenerateCount,
        problemTitle,
    });
    // ================================================================
    // PHASE 17: RESPONSE ASSEMBLY
    //
    // 1. Refusal prefix (DENY_FULL_SOLUTION mode)
    // 2. Hint label prefix (HINTS_ONLY mode)
    // 3. Low-confidence notice (if score < 0.45 and metadata on)
    // 4. Prefix segment merge (mixed-intent greeting reattachment)
    // 5. Whitespace normalisation
    // ================================================================
    const assemblyResult = await responseAssembler({
        rawAnswer: generationResult.rawAnswer,
        prefixSegment: intentRoute.prefixSegment,
        permissions: permissions,
        overallConfidence: confidenceResult.overallConfidence,
        injectConfidenceMetadata: false,
        generationSucceeded: generationResult.generationSucceeded,
        problemTitle,
    });
    // ================================================================
    // PHASE 18: BACKGROUND TASKS (fire-and-forget, zero latency)
    //
    // Task A — storeMessageEmbedding (pgvector, for future backtracking)
    // Task B — updateConversationSummary (every 10 messages)
    // Task C — persistLastRetrievalConfidence (for Tier-2 next run)
    // Task D — storeAiChatKnowledge (Pinecone, default namespace only)
    // ================================================================
    storeMessageEmbedding({
        messageId: userMessageId,
        chatId,
        content: activeMessage,
        role: "user",
    }).catch((err) => logger.error("Phase 18A: failed to store message embedding", {
        err,
        chatId,
    }));
    shouldUpdateSummary(chatId, activePath, currentLeaf)
        .then((needsUpdate) => {
        if (needsUpdate) {
            return updateConversationSummary({
                chatId,
                activePath,
                leafMessageId: currentLeaf,
                problemTitle,
            });
        }
    })
        .catch((err) => logger.error("Phase 18B: failed to update conversation summary", {
        err,
        chatId,
    }));
    persistLastRetrievalConfidence(chatId, userMessageId, filteredDocuments.retrievalConfidence).catch((err) => logger.error("Phase 18C: failed to persist retrieval confidence", {
        err,
        chatId,
        userMessageId,
    }));
    // Phase 18D: store in Pinecone default namespace only (not interview/platform)
    if (!pineconeNamespace) {
        storeAiChatKnowledgeBackground({
            chatId,
            userMessageId,
            normalizedQuery: finalNormalizedQuery,
            embedding: finalEmbedding,
            assistantResponse: assemblyResult.finalResponse,
            model: aiModel,
            regenerateCount,
            userId,
        });
    }
    logger.info("Pipeline: complete", {
        chatId,
        userId,
        problemTitle,
        aiModel,
        regenerate,
        overallConfidence: confidenceResult.overallConfidence,
        retrievalConfidence: filteredDocuments.retrievalConfidence,
        contextStrategy: contextStrategy.strategy,
        tier2Active: regenerate,
        tier2Strategy,
        tier1Fired,
        tier1AttemptCount,
        semanticBacktrackingUsed: contextStrategy.enableSemanticBacktracking,
        relevantPastMessagesRetrieved: relevantPastMessages.length,
        hasSummary: conversationSummary !== null,
        regenerateMode,
        responseLength: assemblyResult.finalResponse.length,
        namespace: pineconeNamespace ?? "default",
    });
    return assemblyResult.finalResponse;
};
;
// ============================================================
// HELPERS
// ============================================================
const persistLastRetrievalConfidence = async (chatId, userMessageId, retrievalConfidence) => {
    await prisma.regenerateState.updateMany({
        where: { chatId, userMessageId },
        data: { lastRetrievalConfidence: retrievalConfidence },
    });
};
// Wraps searchAiChatKnowledge with namespace + userId filter support.
// Your existing pineconeService.ts must accept these params (see diff guide).
async function searchAiChatKnowledgeWithNamespace(embedding, topK, chatId, namespace, userId) {
    return searchAiChatKnowledge(embedding, topK, chatId, namespace, userId);
}
// Phase 18D background Pinecone store
function storeAiChatKnowledgeBackground(input) {
    import("./pineconeService.js")
        .then(({ storeAiChatKnowledge }) => storeAiChatKnowledge({
        id: `${input.chatId}_${input.userMessageId}`,
        normalizedQuery: input.normalizedQuery,
        normalizedQueryEmbedding: input.embedding,
        assistantResponse: input.assistantResponse,
        chatId: input.chatId,
        userMessageId: input.userMessageId,
        model: input.model,
        regenerateCount: input.regenerateCount,
        userId: input.userId,
    }))
        .catch((err) => logger.error("Phase 18D: failed to store in Pinecone", {
        err,
        chatId: input.chatId,
    }));
}
