import React from "react";
import { cn } from "@/lib/utils";

const DIFFICULTY_STYLES: Record<"easy" | "medium" | "hard", string> = {
  easy: "bg-green-500/15 text-green-500",
  medium: "bg-yellow-500/15 text-yellow-500",
  hard: "bg-red-500/15 text-red-500",
};

type DifficultyBadgeProps = {
  difficulty: "easy" | "medium" | "hard";
  isSelected: boolean;
};

const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({
  difficulty,
  isSelected,
}) => {
  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        isSelected ? "bg-white/20 text-[var(--brand-foreground)]" : DIFFICULTY_STYLES[difficulty],
      )}
    >
      {difficulty}
    </span>
  );
};

export default DifficultyBadge;
