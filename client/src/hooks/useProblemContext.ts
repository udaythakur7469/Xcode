"use client";

import { useEffect } from "react";
import { useProblemStore } from "@/features/problemStore";
import { useChatStore } from "@/features/chatStore";

/**
 * useProblemContext
 *
 * Call this hook at the top of the problem detail page component.
 * It syncs the current problem's title into chatStore so that
 * every sendMessage / regenerateMessage / editAndResendMessage call
 * automatically includes problemTitle in the request body.
 *
 * The title is cleared from chatStore when the problem page unmounts
 * (user navigates away), so the AI chat reverts to general mode.
 */
export function useProblemContext() {
  const problem = useProblemStore((s) => s.problem);
  const setProblemTitle = useChatStore((s) => s.setProblemTitle);

  useEffect(() => {
    if (problem?.title) {
      setProblemTitle(problem.title);
    }

    // Clear when the problem detail page unmounts
    return () => {
      setProblemTitle(null);
    };
  }, [problem?.title, setProblemTitle]);
}
