import { cosineSimilarity } from "./cosineSimilarity.js";
import { generateEmbedding } from "./embeddings.js";
import {
  StyleClassificationOutput,
  TopicShiftDetectionInput,
  TopicShiftDetectionResult,
} from "./types.js";
import { classifyMessageStyle } from "./styleClassification.js";

const REFERENTIAL_PATTERNS = [
  /\bit\b/i,
  /\bthat\b/i,
  /\bthis\b/i,
  /\bagain\b/i,
  /\babove\b/i,
  /\bearlier\b/i,
  /\blike i'm five\b/i,
  /\belaborate\b/i,
  /\bsimpler\b/i,
  /\bexplain it\b/i,
];

const STYLE_ONLY_PATTERNS = [
  /like i'm five/i,
  /in simple terms/i,
  /more detailed/i,
  /shorter/i,
  /longer/i,
  /step by step/i,
  /with examples/i,
];

const hasReferentialIntent = (message: string): boolean => {
  return REFERENTIAL_PATTERNS.some((pattern) => pattern.test(message));
};

const isStyleOnlyMessage = (message: string): boolean => {
  return STYLE_ONLY_PATTERNS.some((pattern) => pattern.test(message));
};

export const topicShiftDetection = async ({
  userMessage,
  previousMessages,
}: TopicShiftDetectionInput): Promise<TopicShiftDetectionResult> => {
  if (previousMessages.length === 0) {
    return {
      isNewTopic: true,
      similarityScore: 0,
      strategy: "RESET",
    };
  }

  if (hasReferentialIntent(userMessage) || isStyleOnlyMessage(userMessage)) {
    return {
      isNewTopic: false,
      similarityScore: 1,
      strategy: "FULL",
    };
  }
  const userMessageEmbedding: number[] = await generateEmbedding(userMessage);

  const previousMessagesEmbedding: number[] = await generateEmbedding(
    previousMessages.join(" ")
  );

  const similarityScore = cosineSimilarity(
    userMessageEmbedding,
    previousMessagesEmbedding
  );

  if (similarityScore < 0.55) {
    return {
      isNewTopic: true,
      similarityScore: similarityScore,
      strategy: "RESET",
    };
  }

  if (similarityScore >= 0.75) {
    return {
      isNewTopic: false,
      similarityScore: similarityScore,
      strategy: "FULL",
    };
  }

  const styleOutput: StyleClassificationOutput = await classifyMessageStyle({
    topicSummary: previousMessages.join("\n"),
    userMessage,
  });

  switch (styleOutput.result) {
    case "NEW_TOPIC":
      return { isNewTopic: true, similarityScore, strategy: "RESET" };

    case "SAME_TOPIC_DEEPER":
      return { isNewTopic: false, similarityScore, strategy: "PARTIAL" };

    case "SAME_TOPIC_STYLE_CHANGE":
    default:
      return { isNewTopic: false, similarityScore, strategy: "FULL" };
  }
};
