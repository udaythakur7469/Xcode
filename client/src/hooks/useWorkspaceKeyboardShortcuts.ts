"use client";

import { useEffect } from "react";

type ShortcutHandlers = {
  onRun: () => void;
  onSubmit: () => void;
  onOpenResetConfirm: () => void;
  onCloseDialogs: () => void;
  onToggleLeftMaximize: () => void;
  onToggleRightMaximize: () => void;
  onToggleTestcaseMaximize: () => void;
  onMinimizeTestcase: () => void;
  onResetLayout: () => void;
  onSwitchToTestcaseTab: () => void;
  onSwitchToResultsTab: () => void;
  onOpenShortcuts: () => void;
  isLeftMaximized: boolean;
  isRightMaximized: boolean;
  isTestcaseMaximized: boolean;
};

/**
 * Binds the contest workspace's keyboard shortcuts (Run, Submit, Reset,
 * panel maximize/reset, bottom-tab switching, shortcuts dialog). Pulled
 * out of ContestWorkspace.tsx so its render logic isn't buried under a
 * 20-branch keydown handler.
 */
export function useWorkspaceKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "'") { e.preventDefault(); handlers.onRun(); }
      else if (ctrl && e.key === "Enter") { e.preventDefault(); handlers.onSubmit(); }
      else if (ctrl && e.key === "Backspace") { e.preventDefault(); handlers.onOpenResetConfirm(); }
      else if (ctrl && e.key === "ArrowRight") { e.preventDefault(); if (!handlers.isLeftMaximized) handlers.onToggleLeftMaximize(); }
      else if (ctrl && e.key === "ArrowLeft") { e.preventDefault(); if (!handlers.isRightMaximized) handlers.onToggleRightMaximize(); }
      else if (ctrl && e.key === "ArrowUp") { e.preventDefault(); if (!handlers.isTestcaseMaximized) handlers.onToggleTestcaseMaximize(); }
      else if (ctrl && e.key === "ArrowDown") { e.preventDefault(); if (handlers.isTestcaseMaximized) handlers.onMinimizeTestcase(); }
      else if (ctrl && e.key === " ") { e.preventDefault(); handlers.onResetLayout(); }
      else if (e.shiftKey && e.key === "1") { handlers.onSwitchToTestcaseTab(); }
      else if (e.shiftKey && e.key === "2") { handlers.onSwitchToResultsTab(); }
      else if (e.altKey && e.key === "/") { e.preventDefault(); handlers.onOpenShortcuts(); }
      else if (e.key === "Escape") { handlers.onCloseDialogs(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handlers]);
}
