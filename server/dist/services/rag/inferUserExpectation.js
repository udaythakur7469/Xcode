const IMPLICIT_CODE_ACCESS_PHRASES = [
    "my solution",
    "my code",
    "the code i wrote",
    "my implementation",
    "what i submitted",
    "my submission",
    "the previous code",
    "the code above",
    "my approach",
    "my logic",
    "the function i made",
    "my answer",
    "what i tried",
    "the code i sent",
    "my function",
    "my method",
    "the solution i wrote",
];
const SUBMISSION_ACCESS_PHRASES = [
    "submitted",
    "submission",
    "last attempt",
    "my last try",
    "what i submitted",
    "previous submission",
];
const EDITOR_ACCESS_PHRASES = [
    "editor",
    "workspace",
    "my editor",
    "in the editor",
];
const ruleBasedExpectationDetection = (message) => {
    const normalizedMessage = message.toLowerCase().trim();
    for (const phrase of IMPLICIT_CODE_ACCESS_PHRASES) {
        if (normalizedMessage.includes(phrase)) {
            return true;
        }
    }
    return false;
};
const inferResourceType = (message) => {
    const normalizedMessage = message.toLowerCase().trim();
    // Check for submission-specific phrases first
    for (const phrase of SUBMISSION_ACCESS_PHRASES) {
        if (normalizedMessage.includes(phrase)) {
            return "SUBMISSION";
        }
    }
    // Check for editor-specific phrases
    for (const phrase of EDITOR_ACCESS_PHRASES) {
        if (normalizedMessage.includes(phrase)) {
            return "EDITOR";
        }
    }
    // Default assumption is submission
    return "SUBMISSION";
};
export const userExpectationChecker = ({ userMessage, normalizedQuery, providedCode, }) => {
    console.log("[userExpectationChecker] Checking for implicit expectations");
    // Check if user expects implicit access using rule-based detection
    const expectsImplicitAccess = ruleBasedExpectationDetection(userMessage);
    if (!expectsImplicitAccess) {
        console.log("[userExpectationChecker] No implicit expectation detected");
        return {
            expectsImplicitAccess: false,
            shouldBlock: false,
        };
    }
    console.log("[userExpectationChecker] User expects implicit access");
    // User expects access but no code provided
    if (!providedCode) {
        const expectedResource = inferResourceType(userMessage);
        const result = {
            expectsImplicitAccess: true,
            expectedResource,
            clarificationMessage: generateClarificationMessage(expectedResource),
            shouldBlock: true,
        };
        console.log("[userExpectationChecker] Blocking - no code provided:", result);
        return result;
    }
    // User provided code, so expectation is met
    console.log("[userExpectationChecker] Expectation met - code provided");
    return {
        expectsImplicitAccess: true,
        shouldBlock: false,
    };
};
const generateClarificationMessage = (resource) => {
    const messages = {
        SUBMISSION: "I don't have access to your submitted solution yet. Please paste your code here so I can analyze it accurately.",
        EDITOR: "I can't see your editor content. Please copy and paste your code here so I can help you.",
        HIDDEN_STATE: "I don't have access to your previous code. Please share it here so I can provide accurate feedback.",
    };
    return messages[resource];
};
