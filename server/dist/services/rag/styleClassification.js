import { generateText } from "ai";
import { styleClassificationPromptBuilder } from "./promptBuilder.js";
import { google } from "@ai-sdk/google";
export const classifyMessageStyle = async ({ topicSummary, userMessage, }) => {
    const prompt = styleClassificationPromptBuilder({
        topicSummary,
        userMessage,
    });
    const result = await generateText({
        model: google("gemini-2.0-flash-001"),
        prompt,
        temperature: 0,
    });
    return {
        result: result.text
            .trim()
            .toUpperCase(),
    };
};
