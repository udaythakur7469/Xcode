import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { normalizeUserMessagePromptBuilder } from "./promptBuilder.js";
export const normalizeAiResponse = async (context) => {
    const { currentUserMessage, previousUserMessages, regenerate, aiModelChanged, } = context;
    // Safely serialize previous messages
    const serializedPreviousMessages = previousUserMessages.length > 0
        ? previousUserMessages
            .map((msg, index) => `${index + 1}. ${msg}`)
            .join("\n")
        : "None";
    const prompt = normalizeUserMessagePromptBuilder({
        userMessage: currentUserMessage,
        previousMessages: serializedPreviousMessages,
        regenerate,
        aiModelChanged,
    });
    const result = await generateText({
        model: google("gemini-2.5-flash"),
        prompt,
        temperature: 0, // normalization must be deterministic
    });
    console.log("normalizedQuery", result.text.trim());
    return result.text.trim();
};
