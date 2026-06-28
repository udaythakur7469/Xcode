// server/src/services/rag/detectLongRangeReference.ts
// Patterns that indicate the user is referring to something said
// earlier in the conversation — beyond what the current context
// window would contain. When detected, semantic backtracking
// (pgvector search over full chat history) is enabled.
const LONG_RANGE_PATTERNS = [
    { pattern: /\bearlier\b/i, signal: "earlier", weight: 0.7 },
    { pattern: /\bbefore\b/i, signal: "before", weight: 0.5 },
    { pattern: /\bpreviously\b/i, signal: "previously", weight: 0.8 },
    { pattern: /\bas\s+i\s+said\b/i, signal: "as i said", weight: 0.9 },
    { pattern: /\bthe\s+first\s+(solution|approach|version|attempt)\b/i, signal: "first solution/approach", weight: 0.8 },
    { pattern: /\bthe\s+one\s+from\s+before\b/i, signal: "the one from before", weight: 0.9 },
    { pattern: /\bwe\s+(discussed|talked\s+about|mentioned)\b/i, signal: "we discussed", weight: 0.9 },
    { pattern: /\byou\s+(said|mentioned|suggested|told\s+me)\b/i, signal: "you said/mentioned", weight: 0.85 },
    { pattern: /\bi\s+(mentioned|said|told\s+you)\b/i, signal: "i mentioned", weight: 0.8 },
    { pattern: /\bgo\s+back\s+to\b/i, signal: "go back to", weight: 0.85 },
    { pattern: /\bfrom\s+(the\s+)?(start|beginning)\b/i, signal: "from start/beginning", weight: 0.75 },
    { pattern: /\bcompared\s+to\s+(what|the)\b/i, signal: "compared to", weight: 0.7 },
    { pattern: /\bthat\s+(approach|solution|method|idea)\b/i, signal: "that approach/solution", weight: 0.65 },
    { pattern: /\boriginal\s+(approach|solution|code|version)\b/i, signal: "original solution", weight: 0.8 },
];
// Low-weight patterns that only contribute if nothing stronger matched
const WEAK_PATTERNS = [
    { pattern: /\bagain\b/i, signal: "again", weight: 0.3 },
    { pattern: /\babove\b/i, signal: "above", weight: 0.3 },
];
export const detectLongRangeReference = (userMessage) => {
    const signals = [];
    let maxWeight = 0;
    for (const { pattern, signal, weight } of LONG_RANGE_PATTERNS) {
        if (pattern.test(userMessage)) {
            signals.push(signal);
            if (weight > maxWeight)
                maxWeight = weight;
        }
    }
    // Only check weak patterns if no strong pattern was found
    if (signals.length === 0) {
        for (const { pattern, signal, weight } of WEAK_PATTERNS) {
            if (pattern.test(userMessage)) {
                signals.push(signal);
                if (weight > maxWeight)
                    maxWeight = weight;
            }
        }
    }
    const hasLongRangeReference = signals.length > 0;
    // Confidence is maxWeight, boosted slightly for multiple signals
    const confidence = signals.length > 1
        ? Math.min(1, maxWeight + 0.1 * (signals.length - 1))
        : maxWeight;
    return {
        hasLongRangeReference,
        signals,
        confidence,
    };
};
