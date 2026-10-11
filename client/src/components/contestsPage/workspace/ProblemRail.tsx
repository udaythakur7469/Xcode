"use client";

import React from "react";
import type { ContestWorkspaceProblem } from "@/features/contestStore";

type ProblemRailProps = {
  problems: ContestWorkspaceProblem[];
  selectedLabel: string | null;
  solved: Set<string>;
  attempted: Set<string>;
  firstToSolve: Set<string>;
  onSelect: (label: string) => void;
};

export default function ProblemRail({
  problems,
  selectedLabel,
  solved,
  attempted,
  firstToSolve,
  onSelect,
}: ProblemRailProps) {
  return (
    <div className="border-r flex flex-col gap-1 py-3 px-2 flex-shrink-0 w-[220px] overflow-y-auto">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-2 mb-1">
        Problems
      </div>
      {problems.map((p) => {
        const isSolved = solved.has(p.label);
        const isCurrent = selectedLabel === p.label;
        const isWrongOnly = attempted.has(p.label) && !isSolved;
        return (
          <button
            key={p.label}
            onClick={() => onSelect(p.label)}
            className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors ${
              isCurrent ? "bg-muted border border-border" : "border border-transparent hover:bg-muted/60"
            }`}
          >
            <span
              className={`w-7 h-7 rounded-md border flex items-center justify-center font-mono font-semibold text-[11px] flex-shrink-0 ${
                isSolved
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500"
                  : "bg-muted/40 text-muted-foreground"
              } ${isCurrent && !isSolved ? "!bg-foreground !text-background !border-foreground" : ""} ${
                isWrongOnly ? "ring-2 ring-destructive" : ""
              }`}
            >
              {p.label}
            </span>
            <span className="flex-1 min-w-0">
              <span
                className={`block text-xs font-medium truncate ${
                  isSolved || isCurrent ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {p.problem.title}
              </span>
              <span className="block text-[10px] font-mono text-muted-foreground mt-0.5">{p.points} pts</span>
            </span>
            {firstToSolve.has(p.label) && <span className="text-xs flex-shrink-0">🥇</span>}
          </button>
        );
      })}
    </div>
  );
}
