"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { KeyMoment } from "@/features/interviewStore";

interface KeyMomentsProps {
  keyMoments: KeyMoment[];
}

const MOMENT_CONFIG = {
  BEST: {
    tag: "Best Answer",
    cardClass: "bg-emerald-500/[0.05] border-emerald-500/15",
    barClass: "bg-emerald-500",
    tagClass: "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20",
  },
  WEAKEST: {
    tag: "Weakest Answer",
    cardClass: "bg-red-500/[0.05] border-red-500/15",
    barClass: "bg-red-500",
    tagClass: "text-red-500 bg-red-500/10 border border-red-500/20",
  },
  NOTABLE: {
    tag: "Notable Moment",
    cardClass: "bg-blue-600/[0.05] border-blue-600/15",
    barClass: "bg-blue-600",
    tagClass: "text-blue-400 bg-blue-600/10 border border-blue-600/20",
  },
};

// Consistent order: BEST → WEAKEST → NOTABLE
const MOMENT_ORDER: Array<"BEST" | "WEAKEST" | "NOTABLE"> = [
  "BEST",
  "WEAKEST",
  "NOTABLE",
];

export const KeyMoments: React.FC<KeyMomentsProps> = ({ keyMoments }) => {
  const sorted = MOMENT_ORDER.map((type) =>
    keyMoments.find((m) => m.type === type),
  ).filter(Boolean) as KeyMoment[];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-blue-600/40 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-[30px] h-[30px] rounded-lg bg-blue-600/15 border border-blue-600/40 flex items-center justify-center text-sm">
          ⚡
        </div>
        <h2
          className="text-lg font-bold tracking-[-0.02em] text-foreground"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Key Moments
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex flex-col gap-3">
        {sorted.map((moment) => {
          const config = MOMENT_CONFIG[moment.type];
          return (
            <div
              key={moment.id ?? moment.type}
              className={cn(
                "relative rounded-[10px] border pl-4 pr-4 pt-3 pb-4 overflow-hidden",
                config.cardClass,
              )}
            >
              {/* Left accent bar */}
              <div
                className={cn(
                  "absolute left-0 top-0 bottom-0 w-[3px]",
                  config.barClass,
                )}
              />

              {/* Meta row */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-[0.08em] px-2 py-0.5 rounded-full",
                    config.tagClass,
                  )}
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {config.tag}
                </span>
                <span
                  className="text-[11px] text-muted-foreground"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  Q{moment.questionNumber} · {moment.timestampLabel}
                </span>
              </div>

              {/* Question context */}
              <p className="text-[12px] text-muted-foreground italic mb-2 leading-snug">
                On: &quot;{moment.questionText}&quot;
              </p>

              {/* Quote */}
              <p className="text-[13.5px] text-foreground leading-relaxed mb-2">
                <span className="text-muted-foreground">&quot;</span>
                {moment.quote}
                <span className="text-muted-foreground">&quot;</span>
              </p>

              {/* Annotation */}
              <p className="text-[12px] text-muted-foreground leading-snug">
                {moment.annotation}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
