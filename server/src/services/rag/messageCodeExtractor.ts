import { ArtifactType, ExtractedArtifacts } from "./types.js";

export const extractCodeFromMessage = (message: string): string | null => {
  const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
  const matches = [...message.matchAll(codeBlockRegex)];

  if (matches && matches.length > 0) {
    const code = matches[0][1].trim();
    return code.length > 10 ? code : null;
  }

  const looksLikeCode =
    (message.includes("function") ||
      message.includes("def ") ||
      message.includes("class ") ||
      message.includes("public ") ||
      message.includes("private ")) &&
    (message.includes("{") || message.includes(":")) &&
    message.split("\n").length > 3;

  return looksLikeCode ? message : null;
};

const containsErrorLog = (text: string): boolean => {
  return /exception|stack trace|traceback|error at|segmentation fault|runtime error/i.test(
    text,
  );
};

const containsTestCase = (text: string): boolean => {
  return /test case|failing case|input:\s*\n|output:\s*\n/i.test(text);
};

const containsIO = (text: string): boolean => {
  // Check for explicit input/output labels
  if (/input:|output:|stdin:|stdout:/i.test(text)) {
    return true;
  }

  // Check for common I/O patterns
  if (/expected:\s*\n|actual:\s*\n|given:\s*\n/i.test(text)) {
    return true;
  }

  // Check for array/list representations that could be I/O
  if (/input\s*=\s*\[|output\s*=\s*\[/i.test(text)) {
    return true;
  }

  return false;
};

export const extractArtifacts = ({
  userMessage,
  providedCode,
  providedError,
  providedTestCase,
  providedIO,
}: {
  userMessage: string;
  providedCode?: string | null;
  providedError?: string | null;
  providedTestCase?: string | null;
  providedIO?: string | null;
}): ExtractedArtifacts => {
  const detectedArtifacts: ArtifactType[] = [];

  const hasCode =
    Boolean(providedCode?.trim()) ||
    Boolean(extractCodeFromMessage(userMessage));
  const hasErrorLog =
    Boolean(providedError?.trim()) || containsErrorLog(userMessage);
  const hasTestCase =
    Boolean(providedTestCase?.trim()) || containsTestCase(userMessage);
  const hasIO = Boolean(providedIO?.trim()) || containsIO(userMessage);

  if (hasCode) detectedArtifacts.push("CODE");
  if (hasErrorLog) detectedArtifacts.push("ERROR_LOG");
  if (hasTestCase) detectedArtifacts.push("TEST_CASE");
  if (hasIO) detectedArtifacts.push("INPUT_OUTPUT");

  const extractionConfidence = computeExtractionConfidence({
    hasCode,
    hasErrorLog,
    hasTestCase,
    hasIO,
    userMessage,
  });

  return {
    hasCode,
    hasErrorLog,
    hasTestCase,
    hasIO,
    detectedArtifacts,
    extractionConfidence,
  };
};

const computeExtractionConfidence = ({
  hasCode,
  hasErrorLog,
  hasTestCase,
  hasIO,
  userMessage,
}: {
  hasCode: boolean;
  hasErrorLog: boolean;
  hasTestCase: boolean;
  hasIO: boolean;
  userMessage: string;
}): number => {
  let score = 0;

  // Primary signal weights
  if (hasCode) score += 0.45;
  if (hasErrorLog) score += 0.2;
  if (hasTestCase) score += 0.15;
  if (hasIO) score += 0.1;

  // Strong penalty for implicit references (user expects AI has code)
  if (
    /\b(above|earlier|previous|my code|my solution|already shared)\b/i.test(
      userMessage,
    )
  ) {
    score -= 0.25;
  }

  // Penalty for vague language
  if (/something|stuff|thing|it fails|not working/i.test(userMessage)) {
    score -= 0.1;
  }

  return Math.max(0, Math.min(1, score));
};
