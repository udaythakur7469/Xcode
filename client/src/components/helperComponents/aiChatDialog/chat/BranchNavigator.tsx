"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  MessageNode,
  useChatStore,
  selectSiblings,
} from "@/features/chatStore";

type BranchNavigatorProps = {
  message: MessageNode;
};

const BranchNavigator: React.FC<BranchNavigatorProps> = ({ message }) => {
  const activeChatId = useChatStore((s) => s.activeChatId);
  const navigateBranch = useChatStore((s) => s.navigateBranch);

  // Read nodeMap as a stable reference — Zustand only re-renders when the
  // nodeMap reference itself changes, which it does atomically on every store set().
  const nodeMap = useChatStore((s) => s.nodeMap);

  // Compute siblings using a ref-cached result to avoid creating new arrays
  // on every render. Only recomputes when nodeMap reference or message.id changes.
  const siblingsRef = useRef<MessageNode[]>([]);
  const prevNodeMapRef = useRef<Record<string, MessageNode> | null>(null);
  const prevMessageIdRef = useRef<string>("");

  if (
    nodeMap !== prevNodeMapRef.current ||
    message.id !== prevMessageIdRef.current
  ) {
    prevNodeMapRef.current = nodeMap;
    prevMessageIdRef.current = message.id;
    siblingsRef.current = selectSiblings(nodeMap, message.id);
  }

  const siblings = siblingsRef.current;
  const currentIndex = siblings.findIndex((s) => s.id === message.id);

  // Only show when there are multiple versions
  if (siblings.length <= 1) return null;
  if (!activeChatId) return null;

  const total = siblings.length;
  const displayIndex = currentIndex + 1; // 1-based for display

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < total - 1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canGoPrev) return;
    navigateBranch(activeChatId, siblings[currentIndex - 1].id);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canGoNext) return;
    navigateBranch(activeChatId, siblings[currentIndex + 1].id);
  };

  return (
    <div className="flex items-center gap-1 mt-1.5 mb-0.5">
      <button
        onClick={handlePrev}
        disabled={!canGoPrev}
        title="Previous version"
        className="
          flex items-center justify-center
          w-5 h-5 rounded
          text-zinc-400 hover:text-zinc-200
          disabled:opacity-25 disabled:cursor-not-allowed
          hover:bg-zinc-700
          transition-colors
        "
      >
        <ChevronLeft size={13} />
      </button>

      <span className="text-[11px] text-zinc-400 font-medium tabular-nums select-none">
        {displayIndex} / {total}
      </span>

      <button
        onClick={handleNext}
        disabled={!canGoNext}
        title="Next version"
        className="
          flex items-center justify-center
          w-5 h-5 rounded
          text-zinc-400 hover:text-zinc-200
          disabled:opacity-25 disabled:cursor-not-allowed
          hover:bg-zinc-700
          transition-colors
        "
      >
        <ChevronRight size={13} />
      </button>
    </div>
  );
};

export default BranchNavigator;
