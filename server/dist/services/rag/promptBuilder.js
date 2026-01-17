import createHttpError from "http-errors";
export const loadPromptFromEnv = (envKey) => {
    const template = process.env[envKey];
    if (!template) {
        throw createHttpError.NotFound(`${envKey} Prompt not found in env`);
    }
    return template;
};
export const injectValuesIntoPrompt = (template, values) => {
    let result = template;
    for (const [key, value] of Object.entries(values)) {
        const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
        result = result.replace(pattern, value);
    }
    // Safety: ensure no unresolved placeholders remain
    if (/{{\s*[^}]+\s*}}|\$\{\s*[^}]+\s*}/.test(result)) {
        throw createHttpError.InternalServerError("Unresolved placeholders found in prompt template");
    }
    return result;
};
/*
export const topicShiftDetectionPromptBuilder = ({
  userMessage,
  previousMessages,
  similarityScore,
}: TopicShiftDetectionPromptBuilderInput): string => {
  const template = loadPromptFromEnv("TOPIC_SHIFT_DETECTION_PROMPT");
  
  const finalPrompt = injectValuesIntoPrompt(template, {
    userMessage,
    previousMessages: previousMessages.join("\n"),
    similarityScore: similarityScore.toFixed(2),
  });
  
  return finalPrompt;
};
*/
export const normalizeUserMessagePromptBuilder = ({ userMessage, previousMessages, regenerate, aiModelChanged, }) => {
    const template = loadPromptFromEnv("NORMALIZE_USER_MESSAGE_PROMPT");
    const finalPrompt = injectValuesIntoPrompt(template, {
        currentUserMessage: userMessage,
        serializedPreviousMessages: previousMessages,
        regenerate,
        aiModelChanged,
    });
    return finalPrompt;
};
export const styleClassificationPromptBuilder = ({ topicSummary, userMessage, }) => {
    const template = loadPromptFromEnv("STYLE_CLASSIFICATION_PROMPT");
    const finalPrompt = injectValuesIntoPrompt(template, {
        topicSummary,
        userMessage,
    });
    return finalPrompt;
};
