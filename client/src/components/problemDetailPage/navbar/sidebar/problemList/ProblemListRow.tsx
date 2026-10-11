"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ProblemDifficulty,
  ProblemListItem,
  ProblemListStatus,
} from "@/features/problemNavStore";
import {
  ROW_BASE_CLASS,
  ROW_GRID_CLASS,
  SKELETON_TITLE_WIDTHS,
  type ProblemListLayout,
} from "./problemListLayout";

const DIFFICULTY_TEXT: Record<ProblemDifficulty, string> = {
  easy: "text-green-500",
  medium: "text-yellow-500",
  hard: "text-red-500",
};

const DIFFICULTY_DOT: Record<ProblemDifficulty, string> = {
  easy: "bg-green-500",
  medium: "bg-yellow-500",
  hard: "bg-red-500",
};

const STATUS_LABEL: Record<ProblemListStatus, string> = {
  solved: "Solved",
  attempted: "Attempted",
  unsolved: "Unsolved",
};

// Half-filled circle: "started, not finished".
const AttemptedIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    className="block text-yellow-500"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
  </svg>
);

// Solved / attempted get an icon; "unsolved" is deliberately blank so the
// list stays quiet for problems the user has never touched.
const StatusIcon: React.FC<{
  status: ProblemListStatus | null;
  reveal: boolean;
}> = ({ status, reveal }) => {
  if (status !== "solved" && status !== "attempted") return null;
  return (
    <motion.span
      className="flex"
      // Only pops in for the moment the user logs in; on every other
      // mount (scrolling in new pages) the icon is simply there.
      initial={reveal ? { scale: 0, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
    >
      {status === "solved" ? (
        <Check className="block h-4 w-4 text-green-500" strokeWidth={3} />
      ) : (
        <AttemptedIcon />
      )}
    </motion.span>
  );
};

interface ProblemListRowProps {
  item: ProblemListItem;
  layout: ProblemListLayout;
  isCurrent: boolean;
  // false for guests: no status column content at all.
  showStatus: boolean;
  revealStatus: boolean;
  // Roving tabindex: exactly one row is a tab stop, arrows move between rows.
  tabIndex: 0 | -1;
  onSelect: (item: ProblemListItem) => void;
  onFocus: (item: ProblemListItem) => void;
}

export const ProblemListRow = React.memo(function ProblemListRow({
  item,
  layout,
  isCurrent,
  showStatus,
  revealStatus,
  tabIndex,
  onSelect,
  onFocus,
}: ProblemListRowProps) {
  const status = showStatus ? item.status : null;
  const statusLabel = status ? STATUS_LABEL[status] : null;

  return (
    <div
      role="option"
      aria-selected={isCurrent}
      aria-current={isCurrent ? "true" : undefined}
      aria-label={`${item.id}. ${item.title}, ${item.difficulty}${
        statusLabel ? `, ${statusLabel}` : ""
      }`}
      tabIndex={tabIndex}
      data-problem-row=""
      data-problem-id={item.id}
      data-current-problem={isCurrent ? "true" : undefined}
      onClick={() => onSelect(item)}
      onFocus={() => onFocus(item)}
      className={cn(
        ROW_BASE_CLASS,
        ROW_GRID_CLASS[layout],
        "relative cursor-pointer outline-none transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        isCurrent &&
          "bg-brand-muted hover:bg-brand-muted before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-brand",
      )}
    >
      <span className="flex items-center" title={statusLabel ?? undefined}>
        <StatusIcon status={status} reveal={revealStatus} />
      </span>
      <span className="text-sm tabular-nums text-muted-foreground">
        {item.id}
      </span>
      <span className="truncate text-sm">{item.title}</span>
      {layout === "wide" && (
        <span className="truncate text-xs text-muted-foreground">
          {item.tags.slice(0, 2).join(", ")}
        </span>
      )}
      <span>
        {layout === "compact" ? (
          <span
            className={cn(
              "block h-[9px] w-[9px] rounded-full",
              DIFFICULTY_DOT[item.difficulty],
            )}
            title={item.difficulty}
            aria-hidden="true"
          />
        ) : (
          <span
            className={cn(
              "text-sm capitalize",
              DIFFICULTY_TEXT[item.difficulty],
            )}
          >
            {item.difficulty}
          </span>
        )}
      </span>
    </div>
  );
});

interface ProblemListRowSkeletonProps {
  layout: ProblemListLayout;
  index: number;
  showStatus: boolean;
}

/**
 * Same grid, same height, same columns as ProblemListRow - only the
 * contents are placeholders - so nothing shifts when real rows replace it.
 */
export const ProblemListRowSkeleton: React.FC<ProblemListRowSkeletonProps> = ({
  layout,
  index,
  showStatus,
}) => (
  <div
    aria-hidden="true"
    className={cn(ROW_BASE_CLASS, ROW_GRID_CLASS[layout])}
  >
    <span className="flex items-center">
      {showStatus && <Skeleton className="h-4 w-4 rounded-full" />}
    </span>
    <span>
      <Skeleton className="h-3 w-[22px]" />
    </span>
    <span>
      <Skeleton
        className="h-3.5"
        style={{
          width: `${SKELETON_TITLE_WIDTHS[index % SKELETON_TITLE_WIDTHS.length]}%`,
        }}
      />
    </span>
    {layout === "wide" && (
      <span>
        <Skeleton className="h-3 w-[60%]" />
      </span>
    )}
    <span>
      {layout === "compact" ? (
        <Skeleton className="h-[9px] w-[9px] rounded-full" />
      ) : (
        <Skeleton className="h-3 w-11" />
      )}
    </span>
  </div>
);
