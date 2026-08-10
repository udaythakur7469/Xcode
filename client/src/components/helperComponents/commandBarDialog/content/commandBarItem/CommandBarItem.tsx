"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommandBarEntry } from "../commandBarData/commandBarTypes";
import CommandBarItemIcon from "./CommandBarItemIcon";
import CommandBarKeyboardHint from "./CommandBarKeyboardHint";
import DifficultyBadge from "./DifficultyBadge";

type CommandBarItemProps = {
  entry: CommandBarEntry;
  isSelected: boolean;
  onMouseEnter: () => void;
  isFirst: boolean;
  isLast: boolean;
  registerRef: (el: HTMLDivElement | null) => void;
};

const CommandBarItem: React.FC<CommandBarItemProps> = ({
  entry,
  isSelected,
  onMouseEnter,
  isFirst,
  isLast,
  registerRef,
}) => {
  const isProblemLike = entry.kind === "problem" || entry.kind === "recent";

  return (
    <div
      ref={registerRef}
      role="option"
      aria-selected={isSelected}
      className={cn(
        "relative my-1 flex w-full cursor-pointer flex-row items-center gap-3 rounded-md border border-transparent px-3 py-2.5 transition-colors duration-150",
        isSelected
          ? "text-[var(--brand-foreground)]"
          : "bg-secondary/40 hover:border-border hover:bg-secondary",
      )}
      onClick={entry.onSelect}
      onMouseEnter={onMouseEnter}
    >
      {isSelected && (
        <motion.div
          layoutId="command-bar-highlight"
          className="absolute inset-0 z-0 rounded-md border border-[var(--brand)] bg-[var(--brand)]"
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 40,
            mass: 0.8,
          }}
        />
      )}

      <div className="relative z-10 flex shrink-0 items-center">
        <CommandBarItemIcon icon={entry.icon} isSelected={isSelected} />
      </div>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {entry.title}
          {isProblemLike && entry.difficulty && (
            <DifficultyBadge
              difficulty={entry.difficulty}
              isSelected={isSelected}
            />
          )}
        </div>
        <div
          className={cn(
            "flex items-center gap-1 truncate text-xs",
            isSelected
              ? "text-[var(--brand-foreground)]/85"
              : "text-muted-foreground",
          )}
        >
          {!isProblemLike && <ChevronRight size={12} className="shrink-0" />}
          <span className="truncate">{entry.subtitle}</span>
        </div>
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-1.5">
        {isFirst && (
          <CommandBarKeyboardHint label="Home" isSelected={isSelected} />
        )}
        {isLast && (
          <CommandBarKeyboardHint label="End" isSelected={isSelected} />
        )}
        <ArrowRight
          size={16}
          className={cn(
            "shrink-0 transition-opacity duration-150",
            isSelected ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    </div>
  );
};

CommandBarItem.displayName = "CommandBarItem";

export default CommandBarItem;
