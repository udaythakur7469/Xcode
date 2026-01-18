import prisma from "../../configs/db.js";
import { EditorialAccessTier, HintLevel, RefusalLevel, SolutionIntent, SolutionPermissionMode } from "./types.js";
export async function getOrCreateHelpState(userId, problemId) {
    const helpState = await prisma.problemHelpState.findUnique({
        where: {
            userId_problemId: {
                userId,
                problemId,
            },
        },
    });
    if (helpState) {
        return helpState;
    }
    // Create new help state with defaults
    return await prisma.problemHelpState.create({
        data: {
            userId,
            problemId,
            solutionAttempts: 0,
            maxHintLevel: 0,
            refusalLevel: RefusalLevel.SOFT,
        },
    });
}
export async function incrementSolutionAttempt(userId, problemId) {
    const helpState = await getOrCreateHelpState(userId, problemId);
    const updated = await prisma.problemHelpState.update({
        where: {
            userId_problemId: {
                userId,
                problemId,
            },
        },
        data: {
            solutionAttempts: helpState.solutionAttempts + 1,
        },
    });
    return updated.solutionAttempts;
}
export async function updateHintLevel(userId, problemId) {
    const helpState = await getOrCreateHelpState(userId, problemId);
    const newLevel = Math.min(helpState.maxHintLevel + 1, HintLevel.EDGE_CASES);
    await prisma.problemHelpState.update({
        where: {
            userId_problemId: {
                userId,
                problemId,
            },
        },
        data: {
            maxHintLevel: newLevel,
        },
    });
    return newLevel;
}
export function computeRefusalLevel(attemptCount, confidenceScore) {
    if (attemptCount <= 1)
        return RefusalLevel.SOFT;
    if (attemptCount <= 3 && confidenceScore >= 0.5) {
        return RefusalLevel.FIRM;
    }
    return RefusalLevel.STRICT;
}
export async function updateRefusalLevel(userId, problemId, refusalLevel) {
    await prisma.problemHelpState.update({
        where: {
            userId_problemId: {
                userId,
                problemId,
            },
        },
        data: {
            refusalLevel,
        },
    });
}
export function getAllowedHintLevel(solutionPermissionMode, refusalLevel, currentHintLevel) {
    if (solutionPermissionMode !== SolutionPermissionMode.DENY_FULL_SOLUTION) {
        return HintLevel.NONE;
    }
    if (refusalLevel === RefusalLevel.STRICT) {
        return HintLevel.NONE;
    }
    return currentHintLevel;
}
export function computeSolutionPermissionMode(intent, hasSolved) {
    if (intent === SolutionIntent.FULL_SOLUTION) {
        return hasSolved
            ? SolutionPermissionMode.ALLOW_FULL_SOLUTION
            : SolutionPermissionMode.DENY_FULL_SOLUTION;
    }
    return SolutionPermissionMode.HINTS_ONLY;
}
export function getEditorialAccessTier(hasSolved) {
    if (!hasSolved) {
        return EditorialAccessTier.HINTS_ONLY;
    }
    return EditorialAccessTier.FULL;
}
export function resolvePermissions(intent, hasSolved, attemptCount, currentHintLevel, confidenceScore) {
    const solutionPermissionMode = computeSolutionPermissionMode(intent, hasSolved);
    const refusalLevel = computeRefusalLevel(attemptCount, confidenceScore);
    const maxHintLevel = getAllowedHintLevel(solutionPermissionMode, refusalLevel, currentHintLevel);
    const editorialAccessTier = getEditorialAccessTier(hasSolved);
    return {
        solutionPermissionMode,
        refusalLevel,
        maxHintLevel,
        editorialAccessTier,
    };
}
export function generateRefusalMessage(refusalLevel, attemptCount = 1, problemTitle) {
    const problemContext = problemTitle ? ` for "${problemTitle}"` : "";
    switch (refusalLevel) {
        case RefusalLevel.SOFT:
            return `I can't provide the full solution${problemContext} yet, but I can help guide you! Try thinking about what data structure might be useful here. Would you like a hint?`;
        case RefusalLevel.FIRM:
            return attemptCount > 1
                ? `I understand you're stuck${problemContext}, but providing the solution won't help you learn. You've asked ${attemptCount} times - try working through the problem first, and I'll be happy to review your approach or give you strategic hints!`
                : `I can't provide the full solution${problemContext} before you've tried solving it yourself. Let me give you a hint instead to guide your thinking.`;
        case RefusalLevel.STRICT:
            return `I can't help with solutions${problemContext} before you've attempted the problem yourself. Please try solving it first, or check the official hints available on the problem page. The learning happens when you struggle through it!`;
        default:
            return `Please solve the problem first before requesting the solution.`;
    }
}
export async function resetHelpStateOnSolve(userId, problemId) {
    await prisma.problemHelpState.updateMany({
        where: {
            userId,
            problemId,
        },
        data: {
            solutionAttempts: 0,
            maxHintLevel: 0,
            refusalLevel: RefusalLevel.SOFT,
        },
    });
}
