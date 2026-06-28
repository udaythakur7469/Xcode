// server/src/services/rag/buildDenialContext.ts
//
// Orchestrator called by aiService.ts at each of the 3 blocking points.
//
// Responsibilities:
//   1. Fetch previous RefusalState from DB
//   2. Resolve all StyleDecayInput signals
//   3. Compute next StyleState via styleDecayEngine
//   4. Persist new StyleState (fire-and-forget, non-blocking)
//   5. Assemble and return the DenialContext ready for generateDenialResponse
//
// This is the ONLY module that imports both the decay engine
// and the repository. aiService.ts calls this, not the individual parts.

import logger from "../../configs/loggerConfig.js";
import {
  DenialContext,
  DenialReason,
  RefusalLevel,
  RefusalStyle,
  StyleDecayInput,
} from "./types.js";
import {
  computeNextStyleState,
  mapIntensityToStyle,
  STYLE_COOLDOWN_MS,
} from "./styleDecayEngine.js";
import {
  getRefusalState,
  upsertRefusalState,
} from "./refusalStateRepository.js";

// ============================================================
// BuildDenialContextInput
//
// All signals that aiService.ts has at each blocking point.
// problemId is the numeric DB id of the Problem row.
// ============================================================

export interface BuildDenialContextInput {
  // Identity
  userId: number;
  problemId: number;

  // Denial reason — which gate fired
  denialReason: DenialReason;

  // From permissions (solutionIntentProcessor result)
  refusalLevel: RefusalLevel;

  // From solutionIntentProcessor / ProblemHelpState
  solutionAttemptCount: number;
  intentConfidence: number;
  detectedIntent?: string;

  // From SolvedProblems table (problemContext.userSolved)
  userSolved: boolean;

  // From topicShiftDetection result
  // Pass topicShiftResult.strategy === "RESET" as isNewTopic
  isNewTopic: boolean;

  // From missingArtifactsDetector (only set for MISSING_REQUIRED_ARTIFACTS)
  missingArtifacts?: string[];
}

// ============================================================
// buildDenialContext
//
// Returns a complete DenialContext with the computed RefusalStyle.
// Also persists the new StyleState in the background.
// ============================================================

export const buildDenialContext = async (
  input: BuildDenialContextInput,
): Promise<DenialContext> => {
  const {
    userId,
    problemId,
    denialReason,
    refusalLevel,
    solutionAttemptCount,
    intentConfidence,
    detectedIntent,
    userSolved,
    isNewTopic,
    missingArtifacts,
  } = input;

  // ── Step 1: Read previous state ──────────────────────────────────
  const previousState = await getRefusalState(userId, problemId);

  // ── Step 2: Resolve StyleDecayInput signals ───────────────────────
  const repeatedAttempt = previousState !== null && previousState.denialCount >= 1;

  const confidenceLow = intentConfidence < 0.5;

  const cooldownExpired =
    previousState !== null &&
    Date.now() - previousState.lastUpdatedAt.getTime() > STYLE_COOLDOWN_MS;

  const decayInput: StyleDecayInput = {
    previousState,
    repeatedAttempt,
    confidenceLow,
    isNewTopic,
    userSolved,
    cooldownExpired,
  };

  // ── Step 3: Compute next state ────────────────────────────────────
  const nextState = computeNextStyleState(decayInput);
  const refusalStyle: RefusalStyle = mapIntensityToStyle(nextState.intensity);

  logger.info("buildDenialContext: style computed", {
    userId,
    problemId,
    denialReason,
    previousIntensity: previousState?.intensity ?? "none (first denial)",
    nextIntensity: nextState.intensity,
    refusalStyle,
    repeatedAttempt,
    confidenceLow,
    isNewTopic,
    cooldownExpired,
    userSolved,
  });

  // ── Step 4: Persist new state (fire-and-forget) ───────────────────
  // Non-blocking — style state is a UX concern, not a safety gate.
  // If this fails, the denial still fires with the computed style.
  upsertRefusalState(userId, problemId, nextState).catch((err) =>
    logger.error("buildDenialContext: failed to persist refusal state", {
      err,
      userId,
      problemId,
    }),
  );

  // ── Step 5: Assemble and return DenialContext ─────────────────────
  return {
    denialReason,
    severity: refusalLevel,
    refusalStyle,
    solutionAttemptCount,
    userSolved,
    missingArtifacts,
    detectedIntent,
    confidenceScore: intentConfidence,
  };
};
