// server/src/services/rag/unifiedIntentRouter.ts
import logger from "../../configs/loggerConfig.js";
import { SolutionIntent, } from "./types.js";
import { mixedIntentSplitter } from "./mixedIntentSplitter.js";
// Pure non-task patterns — these short-circuit the entire RAG pipeline.
// The user is not asking about coding; they are greeting, pinging, or
// asking a meta question about the assistant itself.
const GREETING_PATTERNS = [
    /^(hi|hey|hello|howdy|greetings|good\s+(morning|afternoon|evening|day))\s*[!.?]?\s*$/i,
    /^(sup|yo|what'?s\s+up|how\s+are\s+you|how'?s\s+it\s+going)\s*[!.?]?\s*$/i,
];
const META_PATTERNS = [
    /^(who\s+are\s+you|what\s+are\s+you|what\s+can\s+you\s+do|help\s+me)\s*[!.?]?\s*$/i,
    /^(are\s+you\s+(an?\s+)?(ai|bot|assistant|model))\s*[!.?]?\s*$/i,
    /^(what\s+is\s+your\s+(name|purpose|role))\s*[!.?]?\s*$/i,
];
const PING_PATTERNS = [
    /^(ok(ay)?|k|sure|thanks?|thank\s+you|got\s+it|alright|sounds\s+good|great|cool|nice|perfect|awesome)\s*[!.?]?\s*$/i,
    /^(yes|no|yep|nope|yup|nah)\s*[!.?]?\s*$/i,
];
// Mixed-intent prefixes — a non-task opener followed by a real question.
// "Hey, can you debug this?" → prefix: "Hey", task: "can you debug this?"
const MIXED_INTENT_PREFIX_PATTERNS = [
    /^(hi|hey|hello|howdy|yo|sup)\s*[,!]\s*/i,
    /^(okay|ok|alright|sure|great|cool|thanks?)\s*[,!]\s*/i,
];
// Interview prep detection patterns.
// These identify messages where the user is asking about job interviews,
// not about the coding problem they are currently solving.
// When matched, Phase 13 routes to the "interview" Pinecone namespace
// and Phase 2B solution gates are bypassed (interview prep = no restrictions).
const INTERVIEW_PREP_PATTERNS = [
    // Direct interview mentions
    /interview/i,
    /mock\s+interview/i,
    /behavioral\s+(question|round|prep|interview)/i,
    /technical\s+(round|screen|interview)/i,
    /system\s+design\s+(interview|question|round)/i,
    // Common STAR / behavioral phrases
    /tell\s+me\s+about\s+(a\s+time|yourself)/i,
    /star\s+(method|framework|format|technique)/i,
    /what\s+(is|are)\s+your\s+(strength|weakness|greatest)/i,
    /why\s+(do\s+you\s+want|should\s+we\s+hire)/i,
    /where\s+do\s+you\s+see\s+yourself/i,
    // Feedback / verdict interpretation
    /(must.hire|recommended|worth.considering|do.not.hire|not.recommended|prefer.not)/i,
    /(feedback\s+score|category\s+score|total\s+score)/i,
    /how\s+(do\s+i|to)\s+improve\s+(my\s+)?(communication|score|interview)/i,
    // Job prep
    /(faang|maang|big\s*tech|top\s*tech)\s+(interview|prep|question)/i,
    /(on.?site|phone\s+screen|hiring\s+manager)/i,
    /(resume|linkedin|portfolio)\s+(tip|advice|help|review)/i,
    /how\s+(do\s+i|to)\s+(prepare|practice|ace|crack|pass)\s+(an?\s+)?(interview|coding\s+interview|technical)/i,
    /(negotiate|negotiating|salary|offer)/i,
];
const detectInterviewPrepQuery = (message) => INTERVIEW_PREP_PATTERNS.some((p) => p.test(message));
const detectNonTaskPattern = (message) => {
    const trimmed = message.trim();
    for (const pattern of GREETING_PATTERNS) {
        if (pattern.test(trimmed))
            return "GREETING";
    }
    for (const pattern of META_PATTERNS) {
        if (pattern.test(trimmed))
            return "META";
    }
    for (const pattern of PING_PATTERNS) {
        if (pattern.test(trimmed))
            return "PING";
    }
    return null;
};
const hasMixedIntentPrefix = (message) => MIXED_INTENT_PREFIX_PATTERNS.some((p) => p.test(message));
export const unifiedIntentRouter = async (input) => {
    const { userMessage, probeUserMessages, problemTitle } = input;
    const trimmed = userMessage.trim();
    // --- Pure non-task: bypass RAG entirely ---
    const detectedPattern = detectNonTaskPattern(trimmed);
    if (detectedPattern !== null) {
        logger.info("Intent router: pure non-task message detected — bypassing RAG", {
            detectedPattern,
            problemTitle,
            messagePreview: trimmed.substring(0, 60),
        });
        return {
            primaryIntent: SolutionIntent.IRRELEVANT,
            shouldBypassRAG: true,
            isMixedIntent: false,
            prefixSegment: null,
            taskSegment: null,
            detectedPattern,
            isInterviewPrepQuery: false,
        };
    }
    // --- Mixed intent: greeting/ack + real task in same message ---
    if (hasMixedIntentPrefix(trimmed)) {
        const splitResult = await mixedIntentSplitter({
            userMessage: trimmed,
            normalizedQuery: trimmed.toLowerCase(),
            detectedPattern: "GREETING",
        });
        if (splitResult.isMixed && splitResult.taskSegment !== null) {
            logger.info("Intent router: mixed intent detected — splitting message", {
                prefixSegment: splitResult.prefixSegment,
                taskSegmentPreview: splitResult.taskSegment.substring(0, 60),
            });
            const isInterviewMixed = detectInterviewPrepQuery(splitResult.taskSegment ?? trimmed);
            return {
                primaryIntent: SolutionIntent.PARTIAL_HELP,
                shouldBypassRAG: false,
                isMixedIntent: true,
                prefixSegment: splitResult.prefixSegment,
                taskSegment: splitResult.taskSegment,
                detectedPattern: "GREETING",
                isInterviewPrepQuery: isInterviewMixed,
            };
        }
    }
    // --- Pure task message: full pipeline ---
    const isInterviewPrep = detectInterviewPrepQuery(trimmed);
    if (isInterviewPrep) {
        logger.info("Intent router: interview prep query detected", {
            problemTitle,
            messagePreview: trimmed.substring(0, 80),
        });
    }
    return {
        primaryIntent: SolutionIntent.PARTIAL_HELP,
        shouldBypassRAG: false,
        isMixedIntent: false,
        prefixSegment: null,
        taskSegment: null,
        detectedPattern: null,
        isInterviewPrepQuery: isInterviewPrep,
    };
};
