"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { QuestionScore } from "@/features/interviewStore";

interface QuestionHeatmapProps {
  questionScores: QuestionScore[];
}

function getScoreTier(score: number): {
  label: string;
  cardClass: string;
  scoreClass: string;
} {
  if (score >= 80)
    return {
      label: "Strong",
      cardClass:
        "bg-emerald-500/[0.08] border-emerald-500/20 hover:border-emerald-500/40",
      scoreClass: "text-emerald-500",
    };
  if (score >= 65)
    return {
      label: "Good",
      cardClass:
        "bg-blue-600/[0.08] border-blue-600/20 hover:border-blue-600/40",
      scoreClass: "text-blue-400",
    };
  if (score >= 50)
    return {
      label: "Moderate",
      cardClass:
        "bg-amber-500/[0.08] border-amber-500/20 hover:border-amber-500/40",
      scoreClass: "text-amber-500",
    };
  return {
    label: "Weak",
    cardClass: "bg-red-500/[0.08] border-red-500/20 hover:border-red-500/40",
    scoreClass: "text-red-500",
  };
}

const LEGEND = [
  { label: "Strong (80+)", color: "bg-emerald-500" },
  { label: "Good (65–79)", color: "bg-blue-500" },
  { label: "Moderate (50–64)", color: "bg-amber-500" },
  { label: "Weak (<50)", color: "bg-red-500" },
];

export const QuestionHeatmap: React.FC<QuestionHeatmapProps> = ({
  questionScores,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-blue-600/40 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-[30px] h-[30px] rounded-lg bg-blue-600/15 border border-blue-600/40 flex items-center justify-center text-sm">
          🗂️
        </div>
        <h2
          className="text-lg font-bold tracking-[-0.02em] text-foreground"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Answer Quality per Question
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {LEGEND.map((l) => (
          <div
            key={l.label}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <div className={cn("w-[10px] h-[10px] rounded-sm", l.color)} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
      >
        {questionScores.map((q) => {
          const tier = getScoreTier(q.score);
          const isOpen = activeTooltip === q.questionNumber;

          return (
            <div
              key={q.questionNumber}
              className={cn(
                "relative rounded-[10px] border p-3 cursor-pointer transition-all duration-200",
                tier.cardClass,
                isOpen && "translate-y-[-2px] shadow-lg",
              )}
              onClick={() => setActiveTooltip(isOpen ? null : q.questionNumber)}
              onMouseEnter={() => setActiveTooltip(q.questionNumber)}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              <div
                className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground mb-1"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                Q{q.questionNumber}
              </div>
              <div
                className={cn(
                  "text-[22px] font-extrabold leading-none tracking-[-0.04em]",
                  tier.scoreClass,
                )}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {Math.round(q.score)}
              </div>
              <div className="text-[12px] text-muted-foreground mt-1 leading-snug line-clamp-2">
                {q.questionText}
              </div>

              {/* Tooltip */}
              {isOpen && (
                <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-20 w-[220px] rounded-[10px] border border-blue-600/25 bg-card shadow-xl p-3">
                  <div
                    className="text-[11px] text-muted-foreground uppercase tracking-[0.06em] mb-1"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {tier.label} · {Math.round(q.score)}/100
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    {q.comment}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p
        className="text-[12px] text-muted-foreground mt-4"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        Click each card for detailed feedback · {questionScores.length}{" "}
        questions evaluated
      </p>
    </div>
  );
};
