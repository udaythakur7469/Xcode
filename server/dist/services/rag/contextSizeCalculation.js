const DEFAULT_CONTEXT_SIZE = 5;
const FIRST_REGENERATE_SIZE = 10;
const REGENERATE_INCREMENT = 5;
export const calculateContextSize = (regenerateCount, aiModelChanged) => {
    // Model change resets to default context size
    if (aiModelChanged) {
        return DEFAULT_CONTEXT_SIZE;
    }
    // No regenerate = default
    if (regenerateCount === 0) {
        return DEFAULT_CONTEXT_SIZE;
    }
    // First regenerate = 10
    if (regenerateCount === 1) {
        return FIRST_REGENERATE_SIZE;
    }
    // Subsequent regenerates: 10 + (count - 1) * 5
    return FIRST_REGENERATE_SIZE + (regenerateCount - 1) * REGENERATE_INCREMENT;
};
