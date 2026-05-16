"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { RecommendedTopic } from "@/features/interviewStore";

interface RecommendedTopicsProps {
  topics: RecommendedTopic[];
}

const PRIORITY_CONFIG = {
  CRITICAL: {
    label: "Critical",
    iconClass: "bg-red-500/10 border-red-500/20",
    badgeClass: "text-red-500 bg-red-500/10 border-red-500/20",
  },
  IMPORTANT: {
    label: "Important",
    iconClass: "bg-amber-500/10 border-amber-500/20",
    badgeClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  RECOMMENDED: {
    label: "Recommended",
    iconClass: "bg-blue-600/10 border-blue-600/20",
    badgeClass: "text-blue-400 bg-blue-600/10 border-blue-600/20",
  },
};

const PRIORITY_ICONS: Record<string, string> = {
  CRITICAL: "🔴",
  IMPORTANT: "🟡",
  RECOMMENDED: "🔵",
};

// Sort: CRITICAL first, then IMPORTANT, then RECOMMENDED
const PRIORITY_ORDER = ["CRITICAL", "IMPORTANT", "RECOMMENDED"];

export const RecommendedTopics: React.FC<RecommendedTopicsProps> = ({
  topics,
}) => {
  const sorted = [...topics].sort(
    (a, b) =>
      PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-blue-600/40 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-[30px] h-[30px] rounded-lg bg-blue-600/15 border border-blue-600/40 flex items-center justify-center text-sm">
          📚
        </div>
        <h2
          className="text-lg font-bold tracking-[-0.02em] text-foreground"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Recommended Study Topics
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      <p className="text-[13px] text-muted-foreground mb-5">
        Based on your weakest categories — focus these before your next attempt.
      </p>

      <div className="flex flex-col gap-3">
        {sorted.map((topic, i) => {
          const config = PRIORITY_CONFIG[topic.priority];
          return (
            <div
              key={topic.id ?? i}
              className="flex items-start gap-4 p-4 rounded-[10px] border border-border bg-secondary hover:border-blue-600/30 transition-colors"
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-base border",
                  config.iconClass,
                )}
              >
                {PRIORITY_ICONS[topic.priority]}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-[14px] font-bold tracking-[-0.02em] text-foreground"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {topic.topic}
                </div>
                <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">
                  {topic.reason}
                </p>
                {topic.tags.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {topic.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-border text-black"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Priority badge */}
              <div
                className={cn(
                  "text-[10px] font-medium uppercase tracking-[0.06em] px-2 py-1 rounded-lg border flex-shrink-0 self-start",
                  config.badgeClass,
                )}
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {config.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
