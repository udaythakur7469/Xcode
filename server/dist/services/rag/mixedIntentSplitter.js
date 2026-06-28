// server/src/services/rag/mixedIntentSplitter.ts
// Sentence delimiters that commonly separate a prefix greeting
// from the actual task portion of a message.
const SPLIT_DELIMITERS = [",", "!", "?", ".", ";", " - ", " — "];
// After splitting on a delimiter, if the remaining part contains any
// of these task-signal words, it is treated as a real task segment.
const TASK_SIGNAL_WORDS = [
    "can you",
    "could you",
    "please",
    "help",
    "debug",
    "fix",
    "explain",
    "what",
    "why",
    "how",
    "tell me",
    "show me",
    "I need",
    "I want",
    "I'm getting",
    "I get",
    "it",
    "this",
    "my",
];
const containsTaskSignal = (text) => {
    const lower = text.toLowerCase();
    return TASK_SIGNAL_WORDS.some((signal) => lower.includes(signal));
};
export const mixedIntentSplitter = async (input) => {
    const { userMessage } = input;
    for (const delimiter of SPLIT_DELIMITERS) {
        const delimiterIndex = userMessage.indexOf(delimiter);
        if (delimiterIndex === -1)
            continue;
        const before = userMessage.slice(0, delimiterIndex).trim();
        const after = userMessage.slice(delimiterIndex + delimiter.length).trim();
        // The prefix must be short (≤ 20 chars) and the suffix must be
        // non-empty and contain a task signal to qualify as mixed intent.
        if (before.length > 0 &&
            before.length <= 20 &&
            after.length > 0 &&
            containsTaskSignal(after)) {
            return {
                isMixed: true,
                prefixSegment: before,
                taskSegment: after,
            };
        }
    }
    // Could not find a valid split — treat as pure task
    return {
        isMixed: false,
        prefixSegment: userMessage,
        taskSegment: null,
    };
};
