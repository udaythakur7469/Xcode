import createHttpError from "http-errors";
import {
  NormalizeUserMessagePromptBuilderInput,
  SolutionIntent,
} from "./types.js";

export const loadPromptFromEnv = (envKey: string): string => {
  const template = process.env[envKey];

  if (!template) {
    throw createHttpError.NotFound(`${envKey} Prompt not found in env`);
  }

  return template;
};

export const injectValuesIntoPrompt = (
  template: string,
  values: Record<string, any>,
): string => {
  let result = template;

  for (const [key, value] of Object.entries(values)) {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(pattern, value);
  }

  // Safety: ensure no unresolved placeholders remain
  if (/{{\s*[^}]+\s*}}|\$\{\s*[^}]+\s*}/.test(result)) {
    throw createHttpError.InternalServerError(
      "Unresolved placeholders found in prompt template",
    );
  }

  return result;
};
/*
export const topicShiftDetectionPromptBuilder = ({
  userMessage,
  previousMessages,
  similarityScore,
}: TopicShiftDetectionPromptBuilderInput): string => {
  const template = loadPromptFromEnv("TOPIC_SHIFT_DETECTION_PROMPT");
  
  const finalPrompt = injectValuesIntoPrompt(template, {
    userMessage,
    previousMessages: previousMessages.join("\n"),
    similarityScore: similarityScore.toFixed(2),
  });
  
  return finalPrompt;
};
*/

export const normalizeUserMessagePromptBuilder = ({
  userMessage,
  previousMessages,
  regenerate,
  aiModelChanged,
}: NormalizeUserMessagePromptBuilderInput): string => {
  const template = loadPromptFromEnv("NORMALIZE_USER_MESSAGE_PROMPT");

  const finalPrompt = injectValuesIntoPrompt(template, {
    currentUserMessage: userMessage,
    serializedPreviousMessages: previousMessages,
    regenerate,
    aiModelChanged,
  });

  return finalPrompt;
};

export const styleClassificationPromptBuilder = ({
  topicSummary,
  userMessage,
}: {
  topicSummary: string;
  userMessage: string;
}): string => {
  const template = loadPromptFromEnv("STYLE_CLASSIFICATION_PROMPT");

  const finalPrompt = injectValuesIntoPrompt(template, {
    topicSummary,
    userMessage,
  });

  return finalPrompt;
};

export const solutionIntentClassificationPromptBuilder = (
  userMessage: string,
  previousUserMessages: string[],
  hasSolved: boolean,
  problemTitle?: string,
  difficulty?: string,
): string => {
  const template = loadPromptFromEnv("INTENT_DETECTION_PROMPT");

  const finalPrompt = injectValuesIntoPrompt(template, {
    userMessage,
    previousUserMessages,
    hasSolved,
    problemTitle,
    difficulty,
  });

  return finalPrompt;
};

export const llmBasedArtifactsDetectionPromptBuilder = (
  userMessage: string,
  normalizedQuery: string,
  intent: SolutionIntent,
  hasCode: Boolean,
  hasErrorLog: Boolean,
  hasTestCase: Boolean,
  hasIO: Boolean,
): string => {
  const template = loadPromptFromEnv("MISSING_ARTIFACT_DETECTION_PROMPT");

  const finalPrompt = injectValuesIntoPrompt(template, {
    currentUserMessage: userMessage,
    normalizedQuery: normalizedQuery,
    detectedIntent: intent,
    hasCode,
    hasErrorLog,
    hasTestCase,
    hasIO,
  });

  return finalPrompt;
};
