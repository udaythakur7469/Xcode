// server/src/services/rag/retrievalRetry.ts

import logger from "../../configs/loggerConfig.js";
import { generateEmbedding } from "./embeddings.js";
import { filterDocuments } from "./filter.js";
import { searchAiChatKnowledge } from "./pineconeService.js";
import {
  AutoRetryResult,
  FilterResult,
  RetryAttempt,
  RetryRetrievalOptions,
  RetryStrategy,
} from "./types.js";

const MAX_AUTO_RETRIES = 2;

// Below this value after initial filter, Tier-1 fires.
export const AUTO_RETRY_CONFIDENCE_THRESHOLD = 0.55;

const ATTEMPT_OPTIONS: ReadonlyArray<{
  strategy: RetryStrategy;
  topK: number;
  similarityThreshold: number;
  useExpandedQuery: boolean;
}> = [
  {
    strategy: "EXPAND_QUERY",
    topK: 5,
    similarityThreshold: 0.72,
    useExpandedQuery: true,
  },
  {
    strategy: "MORE_DOCUMENTS",
    topK: 10,
    similarityThreshold: 0.65,
    useExpandedQuery: false,
  },
];

// Deterministic query expansion — no LLM call, near-zero latency.
// Appends problem title and common algorithmic terms to widen the
// semantic neighbourhood in Pinecone.
const buildExpandedQuery = (
  normalizedQuery: string,
  problemTitle: string | undefined,
): string => {
  const parts: string[] = [normalizedQuery];

  if (problemTitle !== undefined && problemTitle.trim().length > 0) {
    parts.push(problemTitle.trim());
  }

  parts.push("algorithm approach solution data structure implementation");

  return parts.join(" — ");
};

const runRetrievalPass = async ({
  options,
  normalizedQuery,
  chatId,
  problemTitle,
}: {
  options: RetryRetrievalOptions;
  normalizedQuery: string;
  chatId: string;
  problemTitle: string | undefined;
}): Promise<{
  filterResult: FilterResult;
  embedding: number[];
  queryUsed: string;
}> => {
  const queryUsed =
    options.expandedQuery !== null ? options.expandedQuery : normalizedQuery;

  const embedding = await generateEmbedding(queryUsed);

  const retrievedKnowledge = await searchAiChatKnowledge(
    embedding,
    options.topK,
    chatId,
  );

  const filterResult = await filterDocuments(
    retrievedKnowledge,
    options.similarityThreshold,
  );

  return { filterResult, embedding, queryUsed };
};

export const runAutoRetrievalRetry = async ({
  initialFilterResult,
  initialEmbedding,
  normalizedMessage,
  chatId,
  problemTitle,
}: {
  initialFilterResult: FilterResult;
  initialEmbedding: number[];
  normalizedMessage: string;
  chatId: string;
  problemTitle?: string;
}): Promise<AutoRetryResult> => {
  const attempts: RetryAttempt[] = [];

  let bestFilterResult = initialFilterResult;
  let bestEmbedding = initialEmbedding;
  let bestQuery = normalizedMessage;

  logger.info("Tier-1 auto retry: starting", {
    chatId,
    initialRetrievalConfidence: initialFilterResult.retrievalConfidence,
    threshold: AUTO_RETRY_CONFIDENCE_THRESHOLD,
    maxRetries: MAX_AUTO_RETRIES,
  });

  for (let attemptIndex = 0; attemptIndex < MAX_AUTO_RETRIES; attemptIndex++) {
    const attemptNumber = attemptIndex + 1;
    const confidenceBefore = bestFilterResult.retrievalConfidence;

    if (confidenceBefore >= AUTO_RETRY_CONFIDENCE_THRESHOLD) {
      logger.info("Tier-1 auto retry: threshold met early — stopping", {
        chatId,
        attemptNumber,
        retrievalConfidence: confidenceBefore,
      });
      break;
    }

    const config = ATTEMPT_OPTIONS[attemptIndex];

    const options: RetryRetrievalOptions = {
      topK: config.topK,
      similarityThreshold: config.similarityThreshold,
      expandedQuery: config.useExpandedQuery
        ? buildExpandedQuery(normalizedMessage, problemTitle)
        : null,
    };

    logger.info("Tier-1 auto retry: attempt starting", {
      chatId,
      attemptNumber,
      strategy: config.strategy,
      topK: options.topK,
      threshold: options.similarityThreshold,
      usingExpandedQuery: options.expandedQuery !== null,
    });

    try {
      const { filterResult, embedding, queryUsed } = await runRetrievalPass({
        options,
        normalizedQuery: normalizedMessage,
        chatId,
        problemTitle,
      });

      const improved =
        filterResult.retrievalConfidence > bestFilterResult.retrievalConfidence;

      const attempt: RetryAttempt = {
        attemptNumber,
        strategy: config.strategy,
        retrievalConfidenceBefore: confidenceBefore,
        retrievalConfidenceAfter: filterResult.retrievalConfidence,
        documentsAfterFilter: filterResult.docs.length,
        succeeded: improved,
      };

      attempts.push(attempt);

      if (improved) {
        bestFilterResult = filterResult;
        bestEmbedding = embedding;
        bestQuery = queryUsed;

        logger.info("Tier-1 auto retry: confidence improved", {
          chatId,
          attemptNumber,
          strategy: config.strategy,
          confidenceBefore,
          confidenceAfter: filterResult.retrievalConfidence,
        });
      } else {
        logger.info("Tier-1 auto retry: no improvement — keeping previous best", {
          chatId,
          attemptNumber,
          strategy: config.strategy,
          confidenceBefore,
          confidenceAfter: filterResult.retrievalConfidence,
        });
      }
    } catch (error) {
      logger.error("Tier-1 auto retry: attempt threw — continuing", {
        error,
        chatId,
        attemptNumber,
        strategy: config.strategy,
      });

      attempts.push({
        attemptNumber,
        strategy: config.strategy,
        retrievalConfidenceBefore: confidenceBefore,
        retrievalConfidenceAfter: 0,
        documentsAfterFilter: 0,
        succeeded: false,
      });
    }
  }

  logger.info("Tier-1 auto retry: complete", {
    chatId,
    retriesFired: attempts.length,
    finalRetrievalConfidence: bestFilterResult.retrievalConfidence,
    finalDocCount: bestFilterResult.docs.length,
    queryExpanded: bestQuery !== normalizedMessage,
    thresholdMet: bestFilterResult.retrievalConfidence >= AUTO_RETRY_CONFIDENCE_THRESHOLD,
  });

  return {
    finalFilterResult: bestFilterResult,
    finalEmbedding: bestEmbedding,
    finalNormalizedQuery: bestQuery,
    attempts,
    retriesFired: attempts.length,
    tier: attempts.length > 0 ? "AUTO_RETRIEVAL" : "NONE",
  };
};
