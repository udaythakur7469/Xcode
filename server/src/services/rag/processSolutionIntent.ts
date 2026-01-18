import { detectSolutionIntent } from "./detectSolutionIntent.js";
import {
  generateRefusalMessage,
  getOrCreateHelpState,
  incrementSolutionAttempt,
  resolvePermissions,
  updateHintLevel,
  updateRefusalLevel,
} from "./permissionResolver.js";
import { getProblemContext } from "./problemContext.js";
import {
  EditorialAccessTier,
  HintLevel,
  RefusalLevel,
  SolutionIntent,
  SolutionIntentProcessorResult,
  SolutionPermissionMode,
} from "./types.js";

export const solutionIntentProcessor = async (
  userId: number | null,
  problemTitle: string | null,
  userMessage: string,
  previousUserMessages: string[] | null,
): Promise<SolutionIntentProcessorResult> => {
  console.log("[solutionIntentProcessor] Processing result for:", {
    userId,
    problemTitle,
    messagePreview: userMessage.substring(0, 100),
  });

  if (!problemTitle || !userId) {
    console.log(
      "[solutionIntentGate] No problem context, allowing with hints only",
    );
    return {
      permissions: {
        solutionPermissionMode: SolutionPermissionMode.HINTS_ONLY,
        refusalLevel: RefusalLevel.SOFT,
        maxHintLevel: HintLevel.CONCEPT,
        editorialAccessTier: EditorialAccessTier.HINTS_ONLY,
      },
      shouldBlock: false,
      intent: SolutionIntent.PARTIAL_HELP,
    };
  }

  const problemContext = await getProblemContext(problemTitle, userId);

  if (!problemContext) {
    console.warn("[solutionIntentProcessor] Problem not found:", problemTitle);
    throw new Error("Problem not found");
  }

  console.log("[solutionIntentProcessor] Problem context:", problemContext);

  const { intent, confidence } = await detectSolutionIntent({
    userMessage,
    previousUserMessages,
    problemTitle: problemContext.problemTitle,
    difficulty: problemContext.difficulty,
    hasSolved: problemContext.userSolved,
  });

  console.log("[solutionIntentProcessor] Detected intent:", {
    intent,
    confidence,
  });

  if (intent !== SolutionIntent.FULL_SOLUTION) {
    // Get current help state for hint level
    const helpState = await getOrCreateHelpState(
      userId,
      problemContext.problemId,
    );

    const permissions = resolvePermissions(
      intent,
      problemContext.userSolved,
      helpState.solutionAttempts,
      helpState.maxHintLevel as HintLevel,
      confidence,
    );

    console.log(
      "[solutionIntentProcessor] Non-solution request, allowing:",
      permissions,
    );

    return {
      permissions,
      shouldBlock: false,
      intent,
    };
  }

  const hasSolved = problemContext.userSolved;

  console.log(
    "[solutionIntentProcessor] Full solution requested, user solved:",
    hasSolved,
  );

  if (hasSolved) {
    // User solved it - allow full solution
    const permissions = resolvePermissions(
      intent,
      true,
      0,
      HintLevel.NONE,
      confidence,
    );

    console.log(
      "[solutionIntentProcessor] User solved, allowing full solution",
    );

    return {
      permissions,
      shouldBlock: false,
      intent,
    };
  }

  console.log(
    "[solutionIntentProcessor] User hasn't solved, blocking solution request",
  );

  // Increment solution attempts
  const attemptCount = await incrementSolutionAttempt(userId, problemContext.problemId);

  console.log(
    "[solutionIntentProcessor] Solution attempt count:",
    attemptCount,
  );

  // Update hint level (progressive hints)
  const newHintLevel = await updateHintLevel(userId, problemContext.problemId);

  console.log("[solutionIntentProcessor] Updated hint level:", newHintLevel);

  const permissions = resolvePermissions(
    intent,
    false,
    attemptCount,
    newHintLevel,
    confidence,
  );

  await updateRefusalLevel(
    userId,
    problemContext.problemId,
    permissions.refusalLevel,
  );

  console.log("[solutionIntentProcessor] Resolved permissions:", permissions);

  // Generate refusal message
  const blockMessage = generateRefusalMessage(
    permissions.refusalLevel,
    attemptCount,
    problemContext.problemTitle,
  );

  return {
    permissions,
    shouldBlock: true,
    blockMessage,
    intent,
  };
};
