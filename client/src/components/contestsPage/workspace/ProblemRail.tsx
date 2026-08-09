"use client";

import React from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

type WorkspaceProblem = {
  label: string;
  points: number;
  problem: { difficulty: string };
};

type ProblemRailProps = {
  problems: WorkspaceProblem[];
  selectedLabel: string | null;
  solved: Set<string>;
  attempted: Set<string>;
  onSelect: (label: string) => void;
};

export default function ProblemRail({ problems, selectedLabel, solved, attempted, onSelect }: ProblemRailProps) {
  return (
    <div className="border-r flex flex-col items-center py-4 gap-2 flex-shrink-0 w-16">
      {problems.map((p) => (
        <HoverCard key={p.label} openDelay={150}>
          <HoverCardTrigger asChild>
            <button
              onClick={() => onSelect(p.label)}
              className={`w-[38px] h-[38px] rounded-lg border flex items-center justify-center font-semibold text-sm transition-colors
                ${selectedLabel === p.label ? "bg-primary text-primary-foreground" : ""}
                ${solved.has(p.label) ? "!bg-emerald-500 !border-emerald-500 !text-white" : ""}
                ${attempted.has(p.label) && !solved.has(p.label) ? "ring-2 ring-destructive" : ""}
              `}
            >
              {p.label}
            </button>
          </HoverCardTrigger>
          <HoverCardContent side="right" className="text-xs p-2 w-auto">
            {p.points} pts · {p.problem.difficulty}
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  );
}
