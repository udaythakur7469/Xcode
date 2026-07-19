"use client";

import React, { useState } from "react";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import CalendarGuideDialog from "./CalenderGuideDialog";

type CalendarInfoButtonProps = {
  /** Extra classes — used by callers to position/superimpose this on a corner. */
  className?: string;
};

/**
 * Small circular lightbulb button that opens the Calendar & Analytics
 * Panel guide dialog. Self-contained: owns its own open/close state, so
 * it can be dropped anywhere (e.g. absolutely positioned over a corner)
 * without the parent needing to manage dialog state itself.
 */
const CalendarInfoButton: React.FC<CalendarInfoButtonProps> = ({
  className,
}) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          // Stop click from bubbling into the calendar's own click
          // handlers (e.g. day selection) since this superimposes a
          // corner of the calendar.
          e.stopPropagation();
          setIsGuideOpen(true);
        }}
        title="How does the calendar work?"
        aria-label="Open calendar guide"
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-700",
          className,
        )}
      >
        <Lightbulb size={12} strokeWidth={2.5} />
      </button>

      <CalendarGuideDialog
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </>
  );
};

export default CalendarInfoButton;
