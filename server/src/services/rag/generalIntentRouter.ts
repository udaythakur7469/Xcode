// server/src/services/rag/generalIntentRouter.ts
//
// Classifies user messages that are NOT about coding problems or interviews.
// Uses keyword fast-path first (~0ms), then LLM for ambiguous cases.
//
// Called in aiService.ts as Phase 1.7 (after interviewIntentHandler).
// When isGeneralQuery=true the pipeline short-circuits to generalQueryDispatcher.

import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import logger from "../../configs/loggerConfig.js";

// ─── Intent taxonomy ──────────────────────────────────────────────────────────

export type GeneralTopLevelIntent =
  | "GREETING"           // hi, hello, thanks, who are you
  | "GENERAL_CS"         // what is DP, explain Big O, what is a mutex
  | "PLATFORM_FEATURE"   // how do sticky notes work, how do I create a post
  | "MY_SUBMISSIONS"     // show my submissions for Two Sum, my acceptance rate
  | "MY_STATS"           // my stats, how many problems have I solved
  | "MY_STICKY_NOTES"    // what did I write in my sticky notes about graphs
  | "MY_POSTS"           // posts I've written, my posts on Two Sum
  | "MY_COMMENTS"        // comments I've made
  | "MY_INTERVIEW_HISTORY" // my past interviews, show my last interview
  | "MY_PROFILE"         // my profile, my account info
  | "PROBLEM_POSTS"      // posts for Two Sum, discussions on this problem
  | "POST_COMMENTS"      // comments on my post, what did people say about my post
  | "TEST_CASES"         // test cases for Two Sum, what inputs does this problem have
  | "PROBLEM_STATS"      // how many people solved this, acceptance rate for this problem
  | "NOT_GENERAL";       // actually a problem/interview query, don't handle here

export interface GeneralIntentResult {
  isGeneralQuery: boolean;
  intent: GeneralTopLevelIntent;
  confidence: number;           // 0-1
  // Extracted entities — populated when relevant
  extractedProblemTitle?: string;  // "Two Sum", "Longest Substring"
  extractedKeyword?: string;       // for sticky note / post search
  extractedPostId?: number;
  requiresDbLookup: boolean;       // false = Pinecone/LLM only, true = needs DB fetch
}

// ─── Keyword fast-paths ───────────────────────────────────────────────────────

const GREETING_PATTERNS = [
  /^(hi|hey|hello|sup|yo|howdy|hiya|good (morning|afternoon|evening))[!.,?]?\s*$/i,
  /^(thanks|thank you|thx|ty|cheers)[!.,?]?\s*$/i,
  /^(ok|okay|got it|makes sense|understood|cool|great|nice|awesome)[!.,?]?\s*$/i,
  /^who are you\??$/i,
  /^what (can|do) you do\??$/i,
  /^what is xcode\??$/i,
];

const SUBMISSION_KEYWORDS = [
  "my submission", "my submissions", "show submission", "my solution history",
  "acceptance rate", "problems i solved", "how many i solved",
];

const STATS_KEYWORDS = [
  "my stats", "my statistics", "my progress", "my score",
  "total solved", "easy solved", "medium solved", "hard solved",
  "my rank", "my performance",
];

const STICKY_KEYWORDS = [
  "sticky note", "sticky notes", "my note", "my notes", "what did i write",
  "what's in my note", "note about", "notes about",
];

const POST_KEYWORDS = [
  "my post", "my posts", "post i wrote", "posts i've written",
  "discussion i created", "what did i post",
];

const COMMENT_KEYWORDS = [
  "my comment", "my comments", "comments i made", "comments i wrote",
  "what did i comment",
];

const INTERVIEW_HISTORY_KEYWORDS = [
  "my interview", "my interviews", "past interview", "last interview",
  "my mock interview", "show my interviews",
];

const PLATFORM_KEYWORDS = [
  "how do sticky notes work", "how to create a post", "how do posts work",
  "how do comments work", "what is editorial", "how does editorial work",
  "what are hints", "how do hints work", "how to submit", "how does submission work",
  "what is the ai assistant", "what can the ai do",
  "how to react", "what are reactions", "what features",
];

const PROBLEM_POSTS_KEYWORDS = [
  "posts for", "discussions for", "posts on", "what people say about",
  "posts about this problem", "community posts",
];

const TEST_CASE_KEYWORDS = [
  "test case", "test cases", "what inputs", "sample input", "example input",
  "what does this problem take as input",
];

const PROBLEM_STATS_KEYWORDS = [
  "how many people solved", "acceptance rate for", "problem stats",
  "how popular is", "how hard is this problem statistically",
];

const GENERAL_CS_KEYWORDS = [
  "what is", "explain", "define", "difference between", "how does",
  "what are", "why is", "when to use", "when should i use",
];

function keywordFastPath(message: string): GeneralTopLevelIntent | null {
  const lower = message.toLowerCase().trim();

  if (GREETING_PATTERNS.some((p) => p.test(lower))) return "GREETING";
  if (SUBMISSION_KEYWORDS.some((k) => lower.includes(k))) return "MY_SUBMISSIONS";
  if (STATS_KEYWORDS.some((k) => lower.includes(k))) return "MY_STATS";
  if (STICKY_KEYWORDS.some((k) => lower.includes(k))) return "MY_STICKY_NOTES";
  if (POST_KEYWORDS.some((k) => lower.includes(k))) return "MY_POSTS";
  if (COMMENT_KEYWORDS.some((k) => lower.includes(k))) return "MY_COMMENTS";
  if (INTERVIEW_HISTORY_KEYWORDS.some((k) => lower.includes(k))) return "MY_INTERVIEW_HISTORY";
  if (PLATFORM_KEYWORDS.some((k) => lower.includes(k))) return "PLATFORM_FEATURE";
  if (PROBLEM_POSTS_KEYWORDS.some((k) => lower.includes(k))) return "PROBLEM_POSTS";
  if (TEST_CASE_KEYWORDS.some((k) => lower.includes(k))) return "TEST_CASES";
  if (PROBLEM_STATS_KEYWORDS.some((k) => lower.includes(k))) return "PROBLEM_STATS";

  // General CS: only if the message is short and starts with a question keyword
  // (avoid false-positives on long problem-solving messages)
  const isShort = lower.split(" ").length < 15;
  if (isShort && GENERAL_CS_KEYWORDS.some((k) => lower.startsWith(k))) return "GENERAL_CS";

  return null;
}

// DB lookup map — which intents need a DB call
const DB_REQUIRED_INTENTS = new Set<GeneralTopLevelIntent>([
  "MY_SUBMISSIONS",
  "MY_STATS",
  "MY_STICKY_NOTES",
  "MY_POSTS",
  "MY_COMMENTS",
  "MY_INTERVIEW_HISTORY",
  "MY_PROFILE",
  "PROBLEM_POSTS",
  "POST_COMMENTS",
  "TEST_CASES",
  "PROBLEM_STATS",
]);

// ─── Main detector ────────────────────────────────────────────────────────────

export async function detectGeneralIntent(
  userMessage: string
): Promise<GeneralIntentResult> {
  const notGeneral: GeneralIntentResult = {
    isGeneralQuery: false,
    intent: "NOT_GENERAL",
    confidence: 0,
    requiresDbLookup: false,
  };

  try {
    // Fast path
    const fastIntent = keywordFastPath(userMessage);
    if (fastIntent === "GREETING") {
      return {
        isGeneralQuery: true,
        intent: "GREETING",
        confidence: 0.98,
        requiresDbLookup: false,
      };
    }

    // LLM classification
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      temperature: 0.1,
      maxTokens: 250,
      messages: [
        {
          role: "system",
          content: `You classify user messages for a LeetCode-style coding platform called Xcode.
Determine if this message is a "general query" (NOT about solving a specific coding problem or interview preparation).

Respond ONLY with a JSON object, no markdown.
Schema:
{
  "isGeneralQuery": boolean,
  "intent": one of: "GREETING" | "GENERAL_CS" | "PLATFORM_FEATURE" | "MY_SUBMISSIONS" | "MY_STATS" | "MY_STICKY_NOTES" | "MY_POSTS" | "MY_COMMENTS" | "MY_INTERVIEW_HISTORY" | "MY_PROFILE" | "PROBLEM_POSTS" | "POST_COMMENTS" | "TEST_CASES" | "PROBLEM_STATS" | "NOT_GENERAL",
  "confidence": number 0-1,
  "extractedProblemTitle": string | null,
  "extractedKeyword": string | null
}

Intent rules:
- GREETING: greetings, thanks, acknowledgements, "who are you", "what can you do"
- GENERAL_CS: CS concepts with no problem context (Big O, DP, recursion, SQL vs NoSQL)
- PLATFORM_FEATURE: how platform features work (sticky notes, posts, editorial, hints, submissions UI)
- MY_SUBMISSIONS: user asking about their own submission history, results, acceptance rate
- MY_STATS: user asking about their own solve counts, progress stats
- MY_STICKY_NOTES: user asking about content in their own sticky notes
- MY_POSTS: user asking about posts THEY wrote
- MY_COMMENTS: user asking about comments THEY made
- MY_INTERVIEW_HISTORY: user asking about their past mock interviews
- MY_PROFILE: user asking about their account, profile, links, bio
- PROBLEM_POSTS: user asking about community posts/discussions FOR a specific problem
- POST_COMMENTS: user asking about comments on a specific post
- TEST_CASES: user asking about test cases or example inputs for a problem
- PROBLEM_STATS: user asking about how many users solved a problem, its acceptance rate
- NOT_GENERAL: message is about solving a problem, getting hints, code review, interview prep

Keyword fast-path suggested: ${fastIntent ?? "none — use LLM judgment"}

extractedProblemTitle: fill this if the message references a named problem like "Two Sum" or "LRU Cache".
extractedKeyword: fill this for sticky note / post searches — the topic the user is searching for.`,
        },
        { role: "user", content: userMessage },
      ],
    });

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const intent: GeneralTopLevelIntent = parsed.intent ?? "NOT_GENERAL";

    return {
      isGeneralQuery: parsed.isGeneralQuery ?? false,
      intent,
      confidence: parsed.confidence ?? 0,
      extractedProblemTitle: parsed.extractedProblemTitle ?? undefined,
      extractedKeyword: parsed.extractedKeyword ?? undefined,
      requiresDbLookup: DB_REQUIRED_INTENTS.has(intent),
    };
  } catch (err) {
    logger.error("[detectGeneralIntent] LLM failed, using fast-path fallback", err);
    if (fastIntent) {
      return {
        isGeneralQuery: true,
        intent: fastIntent,
        confidence: 0.6,
        requiresDbLookup: DB_REQUIRED_INTENTS.has(fastIntent),
      };
    }
    return notGeneral;
  }

  // TypeScript needs this — fastIntent is used in catch block
  var fastIntent = keywordFastPath(userMessage);
}
