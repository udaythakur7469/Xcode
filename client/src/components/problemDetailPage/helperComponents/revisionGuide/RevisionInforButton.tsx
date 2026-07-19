"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import RevisionGuideDialog from "./RevisionGuideDialog";

type RevisionInfoButtonProps = {
  /** Extra classes — used by callers to position/superimpose this on a corner. */
  className?: string;
};

/**
 * Small circular "i" button that opens the Revision Guide dialog.
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
          "flex h-4 w-4 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-blue-400 hover:text-blue-400 hover:bg-accent",
          className,
        )}
      >
        <Info size={10} strokeWidth={2.5} />
      </button>

      <RevisionGuideDialog
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </>
  );
};

export default RevisionInfoButton;
