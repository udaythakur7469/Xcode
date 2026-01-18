export interface NormalizationContext {
  currentUserMessage: string;
  previousUserMessages: string[];
  regenerate: boolean;
  aiModelChanged: boolean;
}

export interface GenerateAIResponseParams {
  chatId: string;
  userMessageId: string;
  currentUserMessage: string;
  regenerate: boolean;
  aiModel: string;
  lastMessageModel?: string;
  userId: number;
  problemTitle?: string;
}

export interface StoreAiChatKnowledgeParams {
  id: string;
  normalizedQuery: string;
  normalizedQueryEmbedding: number[];
  assistantResponse: string;
  chatId: string;
  userMessageId: string;
  model: string;
  regenerateCount: number;
}

export interface ChatKnowledgeMetadata {
  normalizedQuery: string;
  assistantResponse: string;
  chatId: string;
  userMessageId: string;
  model: string;
  regenerateCount: number;
  createdAt: number;
}

export interface RetrievedKnowledge {
  id: string;
  score: number;
  metadata: ChatKnowledgeMetadata;
}

export interface FilterResult {
  docs: RetrievedKnowledge[];
  docsLength: number;
  retrievalConfidence: number;
}

export interface TopicShiftDetectionInput {
  userMessage: string;
  previousMessages: string[];
}

export interface TopicShiftDetectionResult {
  isNewTopic: boolean;
  similarityScore: number;
  strategy: "RESET" | "PARTIAL" | "FULL";
}
/* 
export interface TopicShiftDetectionPromptBuilderInput {
  userMessage: string;
  previousMessages: string[];
  similarityScore: number;
}
*/

export interface NormalizeUserMessagePromptBuilderInput {
  userMessage: string;
  previousMessages: string[] | string;
  regenerate: boolean;
  aiModelChanged: boolean;
}

export interface StyleClassificationOutput {
  result: "SAME_TOPIC_STYLE_CHANGE" | "SAME_TOPIC_DEEPER" | "NEW_TOPIC";
}

export enum SolutionIntent {
  FULL_SOLUTION = "FULL_SOLUTION",
  PARTIAL_HELP = "PARTIAL_HELP",
  CONCEPTUAL = "CONCEPTUAL",
  DEBUGGING = "DEBUGGING",
  IRRELEVANT = "IRRELEVANT",
}

export enum SolutionPermissionMode {
  DENY_FULL_SOLUTION = "DENY_FULL_SOLUTION",
  ALLOW_FULL_SOLUTION = "ALLOW_FULL_SOLUTION",
  HINTS_ONLY = "HINTS_ONLY",
}

export enum RefusalLevel {
  SOFT = 1,
  FIRM = 2,
  STRICT = 3,
}

export enum HintLevel {
  NONE = 0,
  CONCEPT = 1,
  DATA_STRUCTURE = 2,
  EDGE_CASES = 3,
}

export enum EditorialAccessTier {
  NONE = 0,
  HINTS_ONLY = 1,
  FULL = 2,
}

export interface IntentDetectionInput {
  userMessage: string;
  previousUserMessages: string[];
  problemTitle?: string;
  difficulty?: string;
  hasSolved?: boolean;
}

export interface IntentDetectionResult {
  intent: SolutionIntent;
  confidence: number;
}

export interface PermissionContext {
  solutionPermissionMode: SolutionPermissionMode;
  refusalLevel: RefusalLevel;
  maxHintLevel: HintLevel;
  editorialAccessTier: EditorialAccessTier;
}

export interface SolutionIntentProcessorResult {
  permissions: PermissionContext;
  shouldBlock: boolean;
  blockMessage?: string;
  intent: SolutionIntent;
}

export interface ProblemContext {
  problemId: number;
  problemTitle: string;
  difficulty: string;
  userSolved: boolean;
}

export type ArtifactType = "CODE" | "ERROR_LOG" | "TEST_CASE" | "INPUT_OUTPUT";

export type ExpectedResource = "SUBMISSION" | "EDITOR" | "HIDDEN_STATE";

export interface ExtractedArtifacts {
  hasCode: boolean;
  hasErrorLog: boolean;
  hasTestCase: boolean;
  hasIO: boolean;
  detectedArtifacts: ArtifactType[];
  extractionConfidence: number;
}

export interface CodeQualityResult {
  isMeaningful: boolean;
  score: number;
  reasons: string[];
}

export interface DetectMissingArtifactsInput {
  userMessage: string;
  normalizedQuery: string;
  detectedIntent: SolutionIntent;
  providedCode?: string | null;
  providedError?: string | null;
  providedTestCase?: string | null;
  providedIO?: string | null;
}

export interface MissingArtifactResult {
  missing: boolean;
  missingArtifacts: ArtifactType[];
  blockGeneration: boolean;
  confidence : number;
  requestMessage?: string;
}

export interface InferUserExpectationInput {
  userMessage: string;
  normalizedQuery: string;
  providedCode?: string | null;
}

export interface UserExpectationResult {
  expectsImplicitAccess: boolean;
  expectedResource?: ExpectedResource;
  clarificationMessage?: string;
  shouldBlock: boolean;
}
