// server/src/services/rag/interviewIntentHandler.ts
//
// Detects interview-related queries and returns structured context
// so the pipeline can skip problem-scoped phases (2A/2B/2C) and
// route retrieval to the interview Pinecone namespace.
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import logger from "../../configs/loggerConfig.js";
// ─── Constants ───────────────────────────────────────────────────────────────
const INTENT_MODEL = "gemini-2.5-flash";
// ─── Keyword fast-path (avoids LLM call for obvious cases) ───────────────────
const INTERVIEW_KEYWORDS = [
    "interview", "mock interview", "behavioral", "technical interview",
    "star method", "system design", "verdict", "feedback score",
    "category score", "must hire", "recommended", "worth considering",
    "do not hire", "areas for improvement", "how to prepare",
    "interview question", "vapi", "voice interview",
];
function keywordFastPath(message) {
    const lower = message.toLowerCase();
    return INTERVIEW_KEYWORDS.some((kw) => lower.includes(kw));
}
// ─── Main detector ────────────────────────────────────────────────────────────
export async function detectInterviewIntent(userMessage) {
    const fallback = {
        isInterviewQuery: false,
        subIntent: "GENERAL",
        confidence: 0,
    };
    // Fast path — skip LLM if clearly interview-related
    const fastHit = keywordFastPath(userMessage);
    try {
        const { text } = await generateText({
            model: google(INTENT_MODEL),
            temperature: 0.1,
            maxTokens: 200,
            messages: [
                {
                    role: "system",
                    content: `You classify whether a user message is about mock job interviews.
Respond ONLY with a JSON object, no markdown, no explanation.
Schema:
{
  "isInterviewQuery": boolean,
  "subIntent": "PREP_TIPS" | "QUESTION_PATTERNS" | "FEEDBACK_INTERPRET" | "PLATFORM_HOWTO" | "GENERAL",
  "confidence": number (0-1),
  "extractedRole": string | null,
  "extractedStack": string[] | null,
  "extractedLevel": string | null,
  "extractedVerdict": string | null
}

Sub-intent rules:
- PREP_TIPS: user asks how to prepare, what to study, tips for interviews
- QUESTION_PATTERNS: user asks what questions come up for a role/stack/level
- FEEDBACK_INTERPRET: user asks about scores, verdicts, category meanings
- PLATFORM_HOWTO: user asks how to use the interview feature on this app
- GENERAL: interview topic but doesn't fit above

If isInterviewQuery is false, set confidence to 0 and subIntent to "GENERAL".
Hint: fast keyword match suggests interview query = ${fastHit}`,
                },
                {
                    role: "user",
                    content: userMessage,
                },
            ],
        });
        const cleaned = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return {
            isInterviewQuery: parsed.isInterviewQuery ?? false,
            subIntent: parsed.subIntent ?? "GENERAL",
            confidence: parsed.confidence ?? 0,
            extractedRole: parsed.extractedRole ?? undefined,
            extractedStack: parsed.extractedStack ?? undefined,
            extractedLevel: parsed.extractedLevel ?? undefined,
            extractedVerdict: parsed.extractedVerdict ?? undefined,
        };
    }
    catch (err) {
        logger.error("[detectInterviewIntent] failed", err);
        // Fall back to keyword-only result
        return {
            ...fallback,
            isInterviewQuery: fastHit,
            subIntent: "GENERAL",
            confidence: fastHit ? 0.5 : 0,
        };
    }
}
