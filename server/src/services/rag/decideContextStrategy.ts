// server/src/services/rag/decideContextStrategy.ts
//
// Replaces the old calculateContextSize → flat number pattern.
// Returns a ContextStrategyDecision that tells the pipeline:
//   - How many recent messages to load
//   - Whether to fetch the conversation summary
//   - Whether to run pgvector semantic backtracking
//
// This is a pure function: no DB calls, no LLM calls, no side effects.

import {
  ContextFetchStrategy,
  ContextStrategyDecision,
  ContextStrategyInput,
} from "./types.js";

const RECENT_ONLY_COUNT = 3;
const FULL_CONTEXT_COUNT = 5;
const EXPANDED_BASE_COUNT = 5;
const EXPANDED_INCREMENT = 5;
const EXPANDED_MAX_COUNT = 20;
const BACKTRACK_MIN_CONFIDENCE = 0.6;

export const decideContextStrategy = (
  input: ContextStrategyInput,
): ContextStrategyDecision => {
  const {
    topicShiftStrategy,
    hasLongRangeReference,
    longRangeConfidence,
    regenerateCount,
    aiModelChanged,
  } = input;

  // ── TARGETED_BACKTRACK ────────────────────────────────────────────
  // Long-range reference detected with sufficient confidence.
  // Load recent messages AND trigger semantic history search.
  if (
    hasLongRangeReference &&
    longRangeConfidence >= BACKTRACK_MIN_CONFIDENCE
  ) {
    return {
      strategy: "TARGETED_BACKTRACK",
      recentMessageCount: FULL_CONTEXT_COUNT,
      includeConversationSummary: true,
      enableSemanticBacktracking: true,
      explanation: `Long-range reference detected (confidence=${longRangeConfidence.toFixed(2)}) — semantic backtracking enabled`,
    };
  }

  // ── RESET ─────────────────────────────────────────────────────────
  // Topic completely changed — start fresh, no recent messages,
  // but include archived summary for cross-topic continuity.
  if (topicShiftStrategy === "RESET") {
    return {
      strategy: "RESET",
      recentMessageCount: 0,
      includeConversationSummary: true,
      enableSemanticBacktracking: false,
      explanation: "Topic reset detected — context window cleared, summary retained",
    };
  }

  // ── EXPANDED ──────────────────────────────────────────────────────
  // User is regenerating (or model changed) — expand the context
  // window progressively to give the LLM more material to work with.
  if (regenerateCount > 0 || aiModelChanged) {
    const expandedCount = Math.min(
      EXPANDED_BASE_COUNT + regenerateCount * EXPANDED_INCREMENT,
      EXPANDED_MAX_COUNT,
    );

    return {
      strategy: "EXPANDED",
      recentMessageCount: expandedCount,
      includeConversationSummary: regenerateCount >= 2,
      enableSemanticBacktracking: false,
      explanation: `Regenerate #${regenerateCount} — expanded context to ${expandedCount} messages`,
    };
  }

  // ── PARTIAL → RECENT_ONLY ─────────────────────────────────────────
  // Topic partially shifted — reduce context to avoid contamination
  // from the earlier discussion thread.
  if (topicShiftStrategy === "PARTIAL") {
    return {
      strategy: "RECENT_ONLY",
      recentMessageCount: RECENT_ONLY_COUNT,
      includeConversationSummary: false,
      enableSemanticBacktracking: false,
      explanation: "Partial topic shift — reduced context window",
    };
  }

  // ── FULL → RECENT_ONLY (default) ──────────────────────────────────
  // Continuing the same topic — standard context window.
  return {
    strategy: "RECENT_ONLY",
    recentMessageCount: FULL_CONTEXT_COUNT,
    includeConversationSummary: false,
    enableSemanticBacktracking: false,
    explanation: "Same topic continuation — standard context window",
  };
};
