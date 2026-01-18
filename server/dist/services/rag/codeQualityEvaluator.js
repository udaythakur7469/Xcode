export const evaluateCodeQuality = (code) => {
    if (!code || code.trim().length === 0) {
        return {
            isMeaningful: false,
            score: 0,
            reasons: ["No code provided"],
        };
    }
    const reasons = [];
    let score = 1.0;
    if (code.length < 50) {
        score -= 0.3;
        reasons.push("Code too short to represent a full solution");
    }
    // Check for basic programming structures
    const structurePatterns = [
        /function\s+\w+/,
        /def\s+\w+/,
        /class\s+\w+/,
        /for\s*\(/,
        /while\s*\(/,
        /if\s*\(/,
        /return\s+/,
    ];
    const hasStructure = structurePatterns.some((p) => p.test(code));
    if (!hasStructure) {
        score -= 0.4;
        reasons.push("No recognizable control flow or function structure");
    }
    // Check for suspicious placeholder patterns
    const suspiciousPatterns = [
        /int\s+\w+\s*;/,
        /var\s+\w+\s*;/,
        /TODO/i,
        /FIXME/i,
    ];
    if (suspiciousPatterns.some((p) => p.test(code)) && code.length < 100) {
        score -= 0.2;
        reasons.push("Likely placeholder or incomplete snippet");
    }
    score = Math.max(0, Math.min(1, score));
    return {
        isMeaningful: score >= 0.5,
        score,
        reasons,
    };
};
