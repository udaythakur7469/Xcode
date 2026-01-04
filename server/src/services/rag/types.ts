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
  lastMessageModel: string;
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
  retrievalConfidence: number;
}

