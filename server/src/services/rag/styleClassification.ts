import { generateText } from "ai";
import { styleClassificationPromptBuilder } from "./promptBuilder.js";
import { StyleClassificationOutput } from "./types.js";
import { google } from "@ai-sdk/google";

export const classifyMessageStyle = async ({
  topicSummary,
  userMessage,
}: {
  topicSummary: string;
  userMessage: string;
}): Promise<StyleClassificationOutput> => {
  const prompt = styleClassificationPromptBuilder({
    topicSummary,
    userMessage,
  });

  const result = await generateText({
    model: google("gemini-2.5-flash"),
    prompt,
    temperature: 0,
  });

  return {
    result: result.text
      .trim()
      .toUpperCase() as StyleClassificationOutput["result"],
  };
};
