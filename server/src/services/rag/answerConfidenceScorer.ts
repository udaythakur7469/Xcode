import logger from "../../configs/loggerConfig.js";
import {
  AnswerConfidenceScorerInput,
  AnswerConfidenceScorerResult,
  RefusalLevel,
  SolutionPermissionMode,
} from "./types.js";

const WEIGHT_RETRIEVAL = 0.3;
const WEIGHT_INTENT = 0.25;
const WEIGHT_ARTIFACT = 0.2;
const WEIGHT_TOPIC = 0.15;
const WEIGHT_REGENERATE = 0.1;

const MAX_REGENERATE_PENALTY_COUNT = 5;

const PERMISSION_CAP_DENY_SOFT = 0.6;
const PERMISSION_CAP_DENY_STRICT = 0.5;
const PERMISSION_CAP_HINTS_ONLY = 0.8;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const computeRegeneratePenaltyScore = (regenerateCount: number): number => {
  if (regenerateCount <= 0) {
    return 1.0;
  }

  const capped = Math.min(regenerateCount, MAX_REGENERATE_PENALTY_COUNT);
  return 1.0 - capped / (MAX_REGENERATE_PENALTY_COUNT * 2);
};

const applyPermissionCap = (
  rawScore: number,
  permissionMode: SolutionPermissionMode,
  refusalLevel: RefusalLevel,
): number => {
  if (
    permissionMode === SolutionPermissionMode.DENY_FULL_SOLUTION &&
    refusalLevel === RefusalLevel.STRICT
  ) {
    return Math.min(rawScore, PERMISSION_CAP_DENY_STRICT);
  }

  if (permissionMode === SolutionPermissionMode.DENY_FULL_SOLUTION) {
    return Math.min(rawScore, PERMISSION_CAP_DENY_SOFT);
  }

  if (permissionMode === SolutionPermissionMode.HINTS_ONLY) {
    return Math.min(rawScore, PERMISSION_CAP_HINTS_ONLY);
  }

  return rawScore;
};

export const answerConfidenceScorer = async (
  input: AnswerConfidenceScorerInput,
): Promise<AnswerConfidenceScorerResult> => {
  const {
    retrievalConfidence,
    intentConfidence,
    artifactConfidence,
    topicSimilarityScore,
    permissions,
    regenerateCount,
    problemTitle,
  } = input;

  const regeneratePenaltyScore = computeRegeneratePenaltyScore(regenerateCount);

  const retrievalComponent = retrievalConfidence * WEIGHT_RETRIEVAL;
  const intentComponent = intentConfidence * WEIGHT_INTENT;
  const artifactComponent = artifactConfidence * WEIGHT_ARTIFACT;
  const topicComponent = topicSimilarityScore * WEIGHT_TOPIC;
  const regenerateComponent = regeneratePenaltyScore * WEIGHT_REGENERATE;

  const rawWeightedScore =
    retrievalComponent +
    intentComponent +
    artifactComponent +
    topicComponent +
    regenerateComponent;

  const clampedScore = clamp(rawWeightedScore, 0, 1);

  const cappedScore = applyPermissionCap(
    clampedScore,
    permissions.solutionPermissionMode,
    permissions.refusalLevel,
  );

  const overallConfidence = Math.round(cappedScore * 1000) / 1000;

  logger.info("Answer confidence scorer: score computed", {
    problemTitle,
    overallConfidence,
    rawWeightedScore: parseFloat(clampedScore.toFixed(3)),
    breakdown: {
      retrievalComponent: parseFloat(retrievalComponent.toFixed(3)),
      intentComponent: parseFloat(intentComponent.toFixed(3)),
      artifactComponent: parseFloat(artifactComponent.toFixed(3)),
      topicComponent: parseFloat(topicComponent.toFixed(3)),
      regenerateComponent: parseFloat(regenerateComponent.toFixed(3)),
    },
    permissionMode: permissions.solutionPermissionMode,
    refusalLevel: permissions.refusalLevel,
  });

  return {
    overallConfidence,
    breakdown: {
      retrievalComponent,
      intentComponent,
      artifactComponent,
      topicComponent,
      regenerateComponent,
    },
  };
};
