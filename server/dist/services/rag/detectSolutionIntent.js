import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { solutionIntentClassificationPromptBuilder } from "./promptBuilder.js";
import { SolutionIntent, } from "./types.js";
const SOLUTION_KEYWORDS = [
    "give me the solution",
    "full solution",
    "complete solution",
    "give me the code",
    "write the code",
    "editorial",
    "optimal solution",
    "step by step solution",
    "how do i solve",
    "how to solve",
    "solve this problem",
    "algorithm for this",
    "complete approach",
    "walk me through",
    "explain the approach",
    "what's the optimal way",
];
const HINT_KEYWORDS = [
    "hint",
    "clue",
    "what data structure",
    "which approach",
    "am i on the right track",
    "guide me",
];
const EXPLANATION_KEYWORDS = [
    "what does this mean",
    "explain the problem",
    "clarify",
    "what are the constraints",
    "understand the example",
    "what does the input",
];
const ruleBasedDetection = (message) => {
    const normalizedMessage = message.toLowerCase().trim();
    for (const keyword of SOLUTION_KEYWORDS) {
        if (normalizedMessage.includes(keyword)) {
            return SolutionIntent.FULL_SOLUTION;
        }
    }
    for (const keyword of HINT_KEYWORDS) {
        if (normalizedMessage.includes(keyword)) {
            return SolutionIntent.PARTIAL_HELP;
        }
    }
    for (const keyword of EXPLANATION_KEYWORDS) {
        if (normalizedMessage.includes(keyword)) {
            return SolutionIntent.CONCEPTUAL;
        }
    }
    return null;
};
const llmBasedRuleDetection = async ({ userMessage, previousUserMessages, problemTitle, difficulty, hasSolved, }) => {
    const prompt = solutionIntentClassificationPromptBuilder(userMessage, previousUserMessages, hasSolved, problemTitle, difficulty);
    const result = await generateText({
        model: google("gemini-2.0-flash-001"),
        prompt,
        temperature: 0,
    });
    const text = result.text.trim().toUpperCase();
    const validIntents = Object.values(SolutionIntent);
    const intent = validIntents.find((i) => text.includes(i)) || SolutionIntent.FULL_SOLUTION;
    console.log("[detectSolutionIntent] LLM classification:", {
        userMessage: userMessage.substring(0, 100),
        detectedIntent: intent,
        rawOutput: text,
    });
    return {
        intent,
        confidence: 0.9,
    };
};
export const detectSolutionIntent = async ({ userMessage, previousUserMessages, problemTitle, difficulty, hasSolved, }) => {
    console.log("[detectSolutionIntent] Starting intent detection for message:", userMessage.substring(0, 100));
    const ruleResult = ruleBasedDetection(userMessage);
    if (ruleResult) {
        console.log("[detectSolutionIntent] Rule-based detection matched:", ruleResult);
        return {
            intent: ruleResult,
            confidence: 1.0,
        };
    }
    console.log("[detectSolutionIntent] No rule match, using LLM classification");
    return await llmBasedRuleDetection({
        userMessage,
        previousUserMessages,
        problemTitle,
        difficulty,
        hasSolved,
    });
};
