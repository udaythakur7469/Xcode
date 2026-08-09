"use client";

import { useRef, useState } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { toast } from "sonner";

/**
 * Owns the 3 resizable-panel refs (left/right/editor/testcase) and the
 * maximize toggle state/handlers for the contest workspace. Mirrors the
 * approach in the real ResizablePanels.tsx, just scoped to the 3 panels
 * this page needs. Used by ContestWorkspace; the refs are handed to the
 * <ResizablePanel> elements it renders.
 */
export function useResizableWorkspaceLayout() {
  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);
  const editorPanelRef = useRef<ImperativePanelHandle>(null);
  const testcasePanelRef = useRef<ImperativePanelHandle>(null);

  const [isLeftMaximized, setIsLeftMaximized] = useState(false);
  const [isRightMaximized, setIsRightMaximized] = useState(false);
  const [isTestcaseMaximized, setIsTestcaseMaximized] = useState(false);

  const toggleLeftMaximize = () => {
    const next = !isLeftMaximized;
    setIsLeftMaximized(next);
    setIsRightMaximized(false);
    leftPanelRef.current?.resize(next ? 95 : 50);
    rightPanelRef.current?.resize(next ? 5 : 50);
  };

  const toggleRightMaximize = () => {
    const next = !isRightMaximized;
    setIsRightMaximized(next);
    setIsLeftMaximized(false);
    rightPanelRef.current?.resize(next ? 95 : 50);
    leftPanelRef.current?.resize(next ? 5 : 50);
  };

  const toggleTestcaseMaximize = () => {
    const next = !isTestcaseMaximized;
    setIsTestcaseMaximized(next);
    testcasePanelRef.current?.resize(next ? 93 : 12);
    editorPanelRef.current?.resize(next ? 7 : 88);
  };

  const resetLayout = () => {
    setIsLeftMaximized(false);
    setIsRightMaximized(false);
    setIsTestcaseMaximized(false);
    leftPanelRef.current?.resize(50);
    rightPanelRef.current?.resize(50);
    editorPanelRef.current?.resize(88);
    testcasePanelRef.current?.resize(12);
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
