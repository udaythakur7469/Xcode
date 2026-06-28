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
  problemId?: number;
  userSolved?: boolean;
  activePath: string[]; 
  isBranch?: boolean;
}

export interface StoreAiChatKnowledgeParams {
  id: string;
  userId?: number;
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
  confidence?: number;
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

export type NonTaskPattern = "GREETING" | "META" | "PING";

export interface UnifiedIntentRouterInput {
  userMessage: string;
  probeUserMessages: string[];
  problemTitle?: string;
}

export interface UnifiedIntentRouterResult {
  primaryIntent: SolutionIntent;
  shouldBypassRAG: boolean;
  isMixedIntent: boolean;
  prefixSegment: string | null;
  taskSegment: string | null;
  detectedPattern: NonTaskPattern | null;
  isInterviewPrepQuery: boolean;
}

export interface MixedIntentSplitterInput {
  userMessage: string;
  normalizedQuery: string;
  detectedPattern: NonTaskPattern;
}

export interface MixedIntentSplitterResult {
  isMixed: boolean;
  prefixSegment: string;
  taskSegment: string | null;
}

export interface LongRangeReferenceResult {
  hasLongRangeReference: boolean;
  signals: string[];
  confidence: number;
}

export type ContextFetchStrategy =
  | "RESET"
  | "RECENT_ONLY"
  | "EXPANDED"
  | "TARGETED_BACKTRACK";

export interface ContextStrategyInput {
  topicShiftStrategy: "RESET" | "PARTIAL" | "FULL";
  hasLongRangeReference: boolean;
  longRangeConfidence: number;
  regenerateCount: number;
  aiModelChanged: boolean;
}

export interface ContextStrategyDecision {
  strategy: ContextFetchStrategy;
  recentMessageCount: number;
  includeConversationSummary: boolean;
  enableSemanticBacktracking: boolean;
  explanation: string;
}

export interface StoreMessageEmbeddingInput {
  messageId: string;
  chatId: string;
  content: string;
  role: "user" | "assistant";
}

export interface FetchConversationSummaryResult {
  summary: string | null;
  messageCount: number;
  exists: boolean;
}

export interface UpdateConversationSummaryInput {
  chatId: string;
  activePath: string[]; 
  leafMessageId: string;
  forceUpdate?: boolean;
  problemTitle?: string;
}

export interface RelevantPastMessage {
  messageId: string;
  content: string;
  similarity: number;
  createdAt: Date;
}

export interface FindRelevantPastMessagesInput {
  chatId: string;
  activePath: string[];
  currentEmbedding: number[];
  excludeRecentCount: number;
  limit: number;
  similarityThreshold: number;
}

export interface AssembledContext {
  summary: string | null;
  relevantPastMessages: RelevantPastMessage[];
  recentMessages: string[];
}

export interface AnswerGenerationInput {
  normalizedMessage: string;
  filteredDocuments: FilterResult;
  permissions: PermissionContext;
  intent: SolutionIntent;
  assembledContext: AssembledContext;
  problemTitle?: string;
  aiModel: string;
  regenerateMode?: boolean;
}

export interface AnswerGenerationResult {
  rawAnswer: string;
  systemPrompt: string;
  userPrompt: string;
  generationSucceeded: boolean;
}

export interface AnswerConfidenceScorerInput {
  retrievalConfidence: number;
  intentConfidence: number;
  artifactConfidence: number;
  topicSimilarityScore: number;
  permissions: PermissionContext;
  regenerateCount: number;
  problemTitle?: string;
}

export interface AnswerConfidenceScorerResult {
  overallConfidence: number;
  breakdown: {
    retrievalComponent: number;
    intentComponent: number;
    artifactComponent: number;
    topicComponent: number;
    regenerateComponent: number;
  };
}

export interface ResponseAssemblerInput {
  rawAnswer: string;
  prefixSegment: string | null;
  permissions: PermissionContext;
  overallConfidence: number;
  injectConfidenceMetadata: boolean;
  generationSucceeded: boolean;
  problemTitle?: string;
}

export interface ResponseAssemblerResult {
  finalResponse: string;
  wasAssembled: boolean;
}

export type RetryTier = "NONE" | "AUTO_RETRIEVAL" | "USER_REGENERATE";

export type RetryStrategy =
  | "EXPAND_QUERY"
  | "RELAX_THRESHOLD"
  | "MORE_DOCUMENTS"
  | "COMPREHENSIVE";

export interface RetryAttempt {
  attemptNumber: number;
  strategy: RetryStrategy;
  retrievalConfidenceBefore: number;
  retrievalConfidenceAfter: number;
  documentsAfterFilter: number;
  succeeded: boolean;
}

export interface RetryRetrievalOptions {
  topK: number;
  similarityThreshold: number;
  expandedQuery: string | null;
}

export interface AutoRetryResult {
  finalFilterResult: FilterResult;
  finalEmbedding: number[];
  finalNormalizedQuery: string;
  attempts: RetryAttempt[];
  retriesFired: number;
  tier: RetryTier;
}

export interface RegenerateStrategyInput {
  normalizedMessage: string;
  chatId: string;
  userId: number;
  problemTitle?: string;
  previousRetrievalConfidence: number;
}

export interface RegenerateStrategyResult {
  strategy: RetryStrategy;
  retrievalOptions: RetryRetrievalOptions;
  explanation: string;
}

export type DenialReason =
  | "REQUESTED_FULL_SOLUTION_UNSOLVED"  
  | "MISSING_REQUIRED_ARTIFACTS"        
  | "IMPLICIT_ACCESS_ASSUMPTION"        
  | "REPEATED_SOLUTION_ATTEMPTS"        
  | "CONFIDENCE_TOO_LOW"              
  | "POLICY_RESTRICTION";           

export enum RefusalStyle {
  ENCOURAGING = "ENCOURAGING", 
  NEUTRAL     = "NEUTRAL",     
  DIRECT      = "DIRECT",      
  MINIMAL     = "MINIMAL",     
}

// 0 = MINIMAL, 3 = ENCOURAGING
export type StyleIntensity = 0 | 1 | 2 | 3;

export interface StyleState {
  intensity: StyleIntensity;
  denialCount: number;
  lastUpdatedAt: Date;
}

export interface StyleDecayInput {
  previousState: StyleState | null;
  repeatedAttempt: boolean;
  confidenceLow: boolean;
  isNewTopic: boolean;
  userSolved: boolean;
  cooldownExpired: boolean;
}

export interface DenialContext {
  denialReason: DenialReason;
  severity: RefusalLevel;         
  refusalStyle: RefusalStyle;     
  solutionAttemptCount: number;   
  userSolved: boolean;            
  missingArtifacts?: string[];   
  detectedIntent?: string;     
  confidenceScore: number;      
}

// ============================================================
// SECTION 15: DENIAL RESPONSE GENERATOR RESULT
// ============================================================

export interface DenialResponseResult {
  message: string;
  refusalStyle: RefusalStyle;
  denialReason: DenialReason;
  generationSucceeded: boolean;
}

// ============================================================
// SECTION 16: GENERATE AI RESPONSE PARAMS EXTENSION
//
// Your existing GenerateAIResponseParams in types.ts needs
// two new optional fields. Find the interface and add them:
//
//   interface GenerateAIResponseParams {
//     chatId: string;
//     userMessageId: string;
//     currentUserMessage: string;
//     regenerate: boolean;
//     aiModel: string;
//     lastMessageModel: string;
//     userId: number;
//     problemTitle?: string;
//     problemId: number;       ← ADD THIS
//     userSolved?: boolean;    ← ADD THIS (optional, defaults to false)
//   }
//
// Then update your sendMessage controller to pass them:
//   problemId: problem.id,    (from the Problem DB lookup)
//   userSolved: problem.userSolved,  (from SolvedProblems table)
// ============================================================

// =============================================================
// GENERAL INTENT TYPES — append to END of types.ts
// Do NOT replace anything.
// =============================================================

// ── General intent taxonomy ───────────────────────────────────────────────────

export type GeneralTopLevelIntent =
  | "GREETING"
  | "GENERAL_CS"
  | "PLATFORM_FEATURE"
  | "MY_SUBMISSIONS"
  | "MY_STATS"
  | "MY_STICKY_NOTES"
  | "MY_POSTS"
  | "MY_COMMENTS"
  | "MY_INTERVIEW_HISTORY"
  | "MY_PROFILE"
  | "PROBLEM_POSTS"
  | "POST_COMMENTS"
  | "TEST_CASES"
  | "PROBLEM_STATS"
  | "NOT_GENERAL";

export interface GeneralIntentResult {
  isGeneralQuery: boolean;
  intent: GeneralTopLevelIntent;
  confidence: number;
  extractedProblemTitle?: string;
  extractedKeyword?: string;
  extractedPostId?: number;
  requiresDbLookup: boolean;
}
