// server/src/services/rag/regenerateFallback.ts
import logger from "../../configs/loggerConfig.js";
// Pinecone topK values per strategy
const REGEN_TOP_K_EXPAND = 10;
const REGEN_TOP_K_MORE_DOCS = 10;
const REGEN_TOP_K_COMPREHENSIVE = 15;
// Similarity thresholds per strategy
const REGEN_THRESHOLD_EXPAND = 0.65;
const REGEN_THRESHOLD_MORE_DOCS = 0.65;
const REGEN_THRESHOLD_COMPREHENSIVE = 0.60;
// Confidence boundaries for strategy selection
const CONFIDENCE_VERY_LOW = 0.40;
const CONFIDENCE_MEDIOCRE = 0.60;
// Builds a richer, more pedagogically-oriented query string for Tier-2.
// Unlike Tier-1 (algorithmic terms), Tier-2 enrichment adds
// "detailed explanation step-by-step walkthrough example" to shift
// the embedding toward instructional content.
const buildEnrichedQuery = (normalizedMessage, problemTitle) => {
    const parts = [normalizedMessage];
    if (problemTitle !== undefined && problemTitle.trim().length > 0) {
        parts.push(problemTitle.trim());
    }
    parts.push("detailed explanation step-by-step walkthrough example");
    return parts.join(" — ");
};
const selectStrategy = (previousRetrievalConfidence) => {
    if (previousRetrievalConfidence < CONFIDENCE_VERY_LOW) {
        return "COMPREHENSIVE";
    }
    if (previousRetrievalConfidence < CONFIDENCE_MEDIOCRE) {
        return "MORE_DOCUMENTS";
    }
    return "EXPAND_QUERY";
};
const buildOptionsForStrategy = (strategy, normalizedMessage, problemTitle) => {
    const enrichedQuery = buildEnrichedQuery(normalizedMessage, problemTitle);
    switch (strategy) {
        case "COMPREHENSIVE":
            return {
                topK: REGEN_TOP_K_COMPREHENSIVE,
                similarityThreshold: REGEN_THRESHOLD_COMPREHENSIVE,
                expandedQuery: enrichedQuery,
            };
        case "MORE_DOCUMENTS":
            // Keep original query — we want quantity, not a different angle
            return {
                topK: REGEN_TOP_K_MORE_DOCS,
                similarityThreshold: REGEN_THRESHOLD_MORE_DOCS,
                expandedQuery: null,
            };
        case "EXPAND_QUERY":
            return {
                topK: REGEN_TOP_K_EXPAND,
                similarityThreshold: REGEN_THRESHOLD_EXPAND,
                expandedQuery: enrichedQuery,
            };
        default:
            return {
                topK: REGEN_TOP_K_MORE_DOCS,
                similarityThreshold: REGEN_THRESHOLD_MORE_DOCS,
                expandedQuery: enrichedQuery,
            };
    }
};
const buildExplanation = (strategy, previousConfidence) => {
    switch (strategy) {
        case "COMPREHENSIVE":
            return (`Comprehensive regenerate: previous retrieval confidence was very low ` +
                `(${previousConfidence.toFixed(3)}) — expanded query + topK=${REGEN_TOP_K_COMPREHENSIVE} + threshold=${REGEN_THRESHOLD_COMPREHENSIVE}`);
        case "MORE_DOCUMENTS":
            return (`More-documents regenerate: mediocre previous confidence ` +
                `(${previousConfidence.toFixed(3)}) — topK=${REGEN_TOP_K_MORE_DOCS} + threshold=${REGEN_THRESHOLD_MORE_DOCS}, original query retained`);
        case "EXPAND_QUERY":
            return (`Expand-query regenerate: previous confidence was acceptable ` +
                `(${previousConfidence.toFixed(3)}) but user regenerated — enriching query for deeper instructional context`);
        default:
            return `Regenerate with expanded retrieval options`;
    }
};
export const buildRegenerateStrategy = (input) => {
    const { normalizedMessage, problemTitle, previousRetrievalConfidence, userId, chatId, } = input;
    const strategy = selectStrategy(previousRetrievalConfidence);
    const retrievalOptions = buildOptionsForStrategy(strategy, normalizedMessage, problemTitle);
    const explanation = buildExplanation(strategy, previousRetrievalConfidence);
    logger.info("Tier-2 regenerate: strategy built", {
        chatId,
        userId,
        strategy,
        previousRetrievalConfidence,
        topK: retrievalOptions.topK,
        similarityThreshold: retrievalOptions.similarityThreshold,
        hasExpandedQuery: retrievalOptions.expandedQuery !== null,
        explanation,
    });
    return { strategy, retrievalOptions, explanation };
};
