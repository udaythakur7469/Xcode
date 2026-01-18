import { generateText } from "ai";
import { llmBasedArtifactsDetectionPromptBuilder } from "./promptBuilder.js";
import {
  ArtifactType,
  DetectMissingArtifactsInput,
  MissingArtifactResult,
  SolutionIntent,
} from "./types.js";
import { google } from "@ai-sdk/google";
import {
  extractArtifacts,
  extractCodeFromMessage,
} from "./messageCodeExtractor.js";
import { evaluateCodeQuality } from "./codeQualityEvaluator.js";

const CODE_ANALYSIS_KEYWORDS = [
  "analyze my solution",
  "analyze my code",
  "check my solution",
  "check my code",
  "review my solution",
  "review my code",
  "optimize my solution",
  "optimize my code",
  "fix my solution",
  "fix my code",
  "is my solution correct",
  "is my code correct",
  "does my solution work",
  "does my code work",
  "improve my solution",
  "improve my code",
];

// Keywords that indicate debugging scenario
const DEBUG_KEYWORDS = [
  "error",
  "exception",
  "crash",
  "failed",
  "failing",
  "wrong answer",
  "tle",
  "time limit",
  "memory limit",
  "runtime error",
  "compilation error",
  "bug",
  "doesn't work",
  "not working",
];

// Keywords that indicate test case/input issues
const TEST_CASE_KEYWORDS = [
  "test case",
  "failing input",
  "wrong output",
  "expected output",
  "actual output",
  "sample input",
  "why does it fail",
  "failing on",
];

const ruleBasedCodeDetection = (message: string): boolean => {
  const normalizedMessage = message.toLowerCase().trim();

  for (const keyword of CODE_ANALYSIS_KEYWORDS) {
    if (normalizedMessage.includes(keyword)) {
      return true;
    }
  }

  return false;
};

const ruleBasedErrorDetection = (message: string): boolean => {
  const normalizedMessage = message.toLowerCase().trim();

  for (const keyword of DEBUG_KEYWORDS) {
    if (normalizedMessage.includes(keyword)) {
      return true;
    }
  }

  return false;
};

const ruleBasedTestCaseDetection = (message: string): boolean => {
  const normalizedMessage = message.toLowerCase().trim();

  for (const keyword of TEST_CASE_KEYWORDS) {
    if (normalizedMessage.includes(keyword)) {
      return true;
    }
  }

  return false;
};

const llmBasedArtifactDetection = async ({
  userMessage,
  normalizedQuery,
  intent,
  ifCodePresent,
  ifTestCasePresent,
  ifErrorPresent,
  ifIOPresent,
}: {
  userMessage: string;
  normalizedQuery: string;
  intent: SolutionIntent;
  ifCodePresent: boolean;
  ifTestCasePresent: boolean;
  ifErrorPresent: boolean;
  ifIOPresent: boolean;
}): Promise<boolean> => {
  try {
    console.log(
      "[llmBasedArtifactDetection] Invoking LLM for artifact detection",
    );

    const prompt = llmBasedArtifactsDetectionPromptBuilder(
      userMessage,
      normalizedQuery,
      intent,
      ifCodePresent,
      ifTestCasePresent,
      ifErrorPresent,
      ifIOPresent,
    );

    const result = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt,
      temperature: 0,
    });

    const llmResponse = result.text.trim().toUpperCase();

    console.log("[llmBasedArtifactDetection] LLM response:", llmResponse);

    return llmResponse === "TRUE";
  } catch (error) {
    console.error("[llmBasedArtifactDetection] LLM detection failed:", error);

    return true;
  }
};

export const missingArtifactsDetector = async ({
  userMessage,
  normalizedQuery,
  detectedIntent,
  providedCode,
  providedError,
  providedTestCase,
  providedIO,
}: DetectMissingArtifactsInput): Promise<MissingArtifactResult> => {
  console.log("[missingArtifactsDetector] Starting artifact detection:", {
    intent: detectedIntent,
    hasProvidedCode: !!providedCode,
    hasProvidedError: !!providedError,
    hasProvidedTestCase: !!providedTestCase,
    hasProvidedIO: !!providedIO,
  });

  const artifacts = extractArtifacts({
    userMessage,
    providedCode,
    providedError,
    providedTestCase,
    providedIO,
  });

  console.log("[missingArtifactsDetector] Extracted artifacts:", artifacts);

  const codeToEvaluate = providedCode || extractCodeFromMessage(userMessage);
  const codeQuality = evaluateCodeQuality(codeToEvaluate);

  console.log(
    "[missingArtifactsDetector] Code quality evaluation:",
    codeQuality,
  );

  if (artifacts.hasCode && !codeQuality.isMeaningful) {
    console.log("[missingArtifactsDetector] Code quality insufficient");
    return {
      missing: true,
      missingArtifacts: ["CODE"],
      blockGeneration: true,
      confidence: codeQuality.score,
      requestMessage: `The code provided appears incomplete or insufficient (${codeQuality.reasons.join(", ")}). Please share your full solution so I can analyze it accurately.`,
    };
  }

  const needsCodeFromIntent = detectedIntent === SolutionIntent.DEBUGGING;
  const needsCodeFromKeywords = ruleBasedCodeDetection(userMessage);
  let needsCode = needsCodeFromIntent || needsCodeFromKeywords;

  const codeRequiringIntents = [
    SolutionIntent.DEBUGGING,
    SolutionIntent.PARTIAL_HELP,
  ];

  const shouldInvokeLLM =
    !needsCode &&
    codeRequiringIntents.includes(detectedIntent) &&
    !artifacts.hasCode;

  if (shouldInvokeLLM) {
    console.log(
      "[missingArtifactsDetector] Rule-based inconclusive, invoking LLM",
    );
    const llmNeedsCode = await llmBasedArtifactDetection({
      userMessage,
      normalizedQuery,
      intent: detectedIntent,
      ifCodePresent: artifacts.hasCode,
      ifTestCasePresent: artifacts.hasTestCase,
      ifErrorPresent: artifacts.hasErrorLog,
      ifIOPresent: artifacts.hasIO,
    });
    needsCode = llmNeedsCode;
    console.log("[missingArtifactsDetector] LLM detection result:", {
      needsCode,
    });
  }

  const needsErrorFromIntent = detectedIntent === SolutionIntent.DEBUGGING;
  const needsErrorFromKeywords = ruleBasedErrorDetection(userMessage);
  const needsError = needsErrorFromIntent || needsErrorFromKeywords;

  const needsTestCase = ruleBasedTestCaseDetection(userMessage);

  const missingArtifacts: ArtifactType[] = [];

  if (needsCode && !artifacts.hasCode) {
    missingArtifacts.push("CODE");
  }

  if (needsError && !artifacts.hasErrorLog && artifacts.hasCode) {
    missingArtifacts.push("ERROR_LOG");
  }

  if (needsTestCase && !artifacts.hasTestCase && artifacts.hasCode) {
    missingArtifacts.push("TEST_CASE");
  }

  const blockGeneration =
    missingArtifacts.length > 0 || artifacts.extractionConfidence < 0.5;

  const result = {
    missing: blockGeneration,
    missingArtifacts,
    blockGeneration,
    confidence: artifacts.extractionConfidence,
    requestMessage: blockGeneration
      ? generateRequestMessage(missingArtifacts, artifacts.extractionConfidence)
      : undefined,
  };

  console.log("[missingArtifactsDetector] Final result:", result);

  return result;
};

const generateRequestMessage = (
  artifacts: ArtifactType[],
  confidence: number,
): string => {
  if (artifacts.length === 0) {
    if (confidence < 0.5) {
      return "Please provide more details so I can help you accurately. If you have code, error messages, or test cases, please share them.";
    }
    return "Please provide the required details so I can help accurately.";
  }

  const messages: Record<ArtifactType, string> = {
    CODE: "your solution code",
    ERROR_LOG: "the exact error message or stack trace",
    TEST_CASE: "the failing test case",
    INPUT_OUTPUT: "the input and expected output",
  };

  const needed = artifacts.map((a) => messages[a]);

  if (needed.length === 1) {
    return `I'll need ${needed[0]} to help you with this. Please paste it here so I can analyze it accurately.`;
  }

  const last = needed.pop();
  return `I'll need ${needed.join(", ")} and ${last} to analyze this properly. Please provide them so I can give you accurate feedback.`;
};
