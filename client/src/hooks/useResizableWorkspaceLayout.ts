"use client";

import { useRef, useState } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { toast } from "sonner";

// Same 500ms cubic ease-in-out rAF animation as problem-detail's
// ResizablePanels.tsx (animateResize) — ported 1:1 so both pages'
// Maximize/Minimize/Reset feel identical. Only the target sizes below
// differ, since the contest workspace has a 3-panel shape instead of
// problem-detail's 2.
function animatePanelResize(
  panelRef: React.RefObject<ImperativePanelHandle>,
  targetSize: number,
  duration = 500,
): Promise<void> {
  return new Promise((resolve) => {
    if (!panelRef.current) {
      resolve();
      return;
    }
    const startSize = panelRef.current.getSize();
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const currentSize = startSize + (targetSize - startSize) * eased;

      panelRef.current?.resize(currentSize);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(step);
  });
}

export function useResizableWorkspaceLayout() {
  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);
  const editorPanelRef = useRef<ImperativePanelHandle>(null);
  const testcasePanelRef = useRef<ImperativePanelHandle>(null);

  const [isLeftMaximized, setIsLeftMaximized] = useState(false);
  const [isRightMaximized, setIsRightMaximized] = useState(false);
  const [isTestcaseMaximized, setIsTestcaseMaximized] = useState(false);

  const toggleLeftMaximize = async () => {
    const next = !isLeftMaximized;
    setIsLeftMaximized(next);
    setIsRightMaximized(false);
    await Promise.all([
      animatePanelResize(leftPanelRef, next ? 95 : 50),
      animatePanelResize(rightPanelRef, next ? 5 : 50),
    ]);
  };

  const toggleRightMaximize = async () => {
    const next = !isRightMaximized;
    setIsRightMaximized(next);
    setIsLeftMaximized(false);
    await Promise.all([
      animatePanelResize(rightPanelRef, next ? 95 : 50),
      animatePanelResize(leftPanelRef, next ? 5 : 50),
    ]);
  };

  const toggleTestcaseMaximize = async () => {
    const next = !isTestcaseMaximized;
    setIsTestcaseMaximized(next);
    await Promise.all([
      animatePanelResize(testcasePanelRef, next ? 93 : 12),
      animatePanelResize(editorPanelRef, next ? 7 : 88),
    ]);
  };

  const resetLayout = async () => {
    setIsLeftMaximized(false);
    setIsRightMaximized(false);
    setIsTestcaseMaximized(false);
    await Promise.all([
      animatePanelResize(leftPanelRef, 50),
      animatePanelResize(rightPanelRef, 50),
      animatePanelResize(editorPanelRef, 88),
      animatePanelResize(testcasePanelRef, 12),
    ]);
    toast.success("Panel layout reset");
  };

  return {
    leftPanelRef,
    rightPanelRef,
    editorPanelRef,
    testcasePanelRef,
    isLeftMaximized,
    isRightMaximized,
    isTestcaseMaximized,
    toggleLeftMaximize,
    toggleRightMaximize,
    toggleTestcaseMaximize,
    resetLayout,
  };
}
