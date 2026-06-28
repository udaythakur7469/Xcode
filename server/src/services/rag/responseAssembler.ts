import logger from "../../configs/loggerConfig.js";
import {
  HintLevel,
  RefusalLevel,
  ResponseAssemblerInput,
  ResponseAssemblerResult,
  SolutionPermissionMode,
} from "./types.js";

const CONFIDENCE_LOW_THRESHOLD = 0.45;

const LOW_CONFIDENCE_NOTICE =
  "\n\n_Note: My confidence in this response is lower than usual. Consider providing more context or rephrasing your question._";

const REFUSAL_PREFIX_MAP: Record<RefusalLevel, string> = {
  [RefusalLevel.SOFT]: "I appreciate the question! However, ",
  [RefusalLevel.FIRM]: "I'm not able to provide that at this stage. ",
  [RefusalLevel.STRICT]: "That falls outside what I can help with right now. ",
};

const HINT_FORMAT_PREFIX_MAP: Record<HintLevel, string> = {
  [HintLevel.NONE]: "",
  [HintLevel.CONCEPT]: "💡 Conceptual hint: ",
  [HintLevel.DATA_STRUCTURE]: "🔧 Structural hint: ",
  [HintLevel.EDGE_CASES]: "⚠️ Edge case hint: ",
};

const GREETING_PREFIX_PATTERN =
  /^(hi|hello|hey|howdy|greetings|good\s+(morning|afternoon|evening|day))/i;

const applyRefusalPrefix = (
  rawAnswer: string,
  permissionMode: SolutionPermissionMode,
  refusalLevel: RefusalLevel,
): string => {
  if (permissionMode !== SolutionPermissionMode.DENY_FULL_SOLUTION) {
    return rawAnswer;
  }

  return REFUSAL_PREFIX_MAP[refusalLevel] + rawAnswer;
};

const applyHintFormatting = (
  rawAnswer: string,
  permissionMode: SolutionPermissionMode,
  maxHintLevel: HintLevel,
): string => {
  if (permissionMode !== SolutionPermissionMode.HINTS_ONLY) {
    return rawAnswer;
  }

  const prefix = HINT_FORMAT_PREFIX_MAP[maxHintLevel];

  if (prefix === "") {
    return rawAnswer;
  }

  return prefix + rawAnswer;
};

const appendConfidenceNotice = (
  answer: string,
  overallConfidence: number,
  injectMetadata: boolean,
): string => {
  if (!injectMetadata) {
    return answer;
  }

  if (overallConfidence < CONFIDENCE_LOW_THRESHOLD) {
    return answer + LOW_CONFIDENCE_NOTICE;
  }

  return answer;
};

const mergePrefixSegment = (
  prefixSegment: string | null,
  formattedAnswer: string,
): string => {
  if (prefixSegment === null || prefixSegment.trim() === "") {
    return formattedAnswer;
  }

  const trimmedPrefix = prefixSegment.trim();

  if (GREETING_PREFIX_PATTERN.test(trimmedPrefix)) {
    return `Hey! ${formattedAnswer}`;
  }

  return `${trimmedPrefix} — ${formattedAnswer}`;
};

const normalizeOutputWhitespace = (response: string): string =>
  response.replace(/\n{3,}/g, "\n\n").trim();

export const responseAssembler = async (
  input: ResponseAssemblerInput,
): Promise<ResponseAssemblerResult> => {
  const {
    rawAnswer,
    prefixSegment,
    permissions,
    overallConfidence,
    injectConfidenceMetadata,
    generationSucceeded,
    problemTitle,
  } = input;

  if (!generationSucceeded) {
    logger.info("Response assembler: generation failed, returning raw fallback", {
      problemTitle,
    });

    return {
      finalResponse: rawAnswer,
      wasAssembled: false,
    };
  }

  let assembled = rawAnswer;

  assembled = applyRefusalPrefix(
    assembled,
    permissions.solutionPermissionMode,
    permissions.refusalLevel,
  );

  assembled = applyHintFormatting(
    assembled,
    permissions.solutionPermissionMode,
    permissions.maxHintLevel,
  );

  assembled = appendConfidenceNotice(
    assembled,
    overallConfidence,
    injectConfidenceMetadata,
  );

  assembled = mergePrefixSegment(prefixSegment, assembled);

  assembled = normalizeOutputWhitespace(assembled);

  logger.info("Response assembler: final response assembled", {
    problemTitle,
    overallConfidence,
    hasPrefixSegment: prefixSegment !== null,
    permissionMode: permissions.solutionPermissionMode,
    refusalLevel: permissions.refusalLevel,
    finalLength: assembled.length,
    wasAssembled: true,
  });

  return {
    finalResponse: assembled,
    wasAssembled: true,
  };
};
