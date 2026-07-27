"use client";

import React, { useState } from "react";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import RevisionGuideDialog from "./RevisionGuideDialog";

type RevisionInfoButtonProps = {
  /** Extra classes — used by callers to position/superimpose this on a corner. */
  className?: string;
};

/**
 * Small circular lightbulb button that opens the Revision Guide dialog.
 * Self-contained: owns its own open/close state, so it can be dropped
 * anywhere (e.g. absolutely positioned over a corner) without the parent
 * needing to manage dialog state itself.
 */
const RevisionInfoButton: React.FC<RevisionInfoButtonProps> = ({
  className,
}) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          // Stop click from bubbling into parent buttons/rows (e.g. the
          // revision queue item button it may be superimposed on).
          e.stopPropagation();
          setIsGuideOpen(true);
        }}
        title="How does the revision queue work?"
        aria-label="Open revision guide"
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white shadow-sm transition-colors hover:bg-brand-dim",
          className,
        )}
      >
        <Lightbulb size={12} strokeWidth={2.5} color="#000000"/>
      </button>

      <RevisionGuideDialog
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </>
  );
};

export default RevisionInfoButton;
