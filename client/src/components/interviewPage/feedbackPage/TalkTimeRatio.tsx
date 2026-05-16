"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TalkTimeRatioProps {
  candidateTalkRatio: number; // 0–100
}

function getBalanceLabel(ratio: number): {
  label: string;
  color: string;
  note: string;
} {
  if (ratio < 45)
    return {
      label: "Too quiet",
      color: "text-red-500",
      note: "You gave short answers. Aim for 55–70% talk time — interviewers want depth.",
    };
  if (ratio > 75)
    return {
      label: "Too much",
      color: "text-amber-500",
      note: "You may have over-explained. Aim for 55–70% — conciseness signals clarity.",
    };
  return {
    label: "Good",
    color: "text-emerald-500",
    note: "Your talk-time is well-balanced. You gave detailed answers without rambling. Ideal range is 55–70%.",
  };
}

export const TalkTimeRatio: React.FC<TalkTimeRatioProps> = ({
  candidateTalkRatio,
}) => {
  const aiRatio = 100 - candidateTalkRatio;
  const balance = getBalanceLabel(candidateTalkRatio);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-blue-600/40 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-[30px] h-[30px] rounded-lg bg-blue-600/15 border border-blue-600/40 flex items-center justify-center text-sm">
          🎙️
        </div>
        <h2
          className="text-lg font-bold tracking-[-0.02em] text-foreground"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Talk-Time Ratio
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="text-center p-3 rounded-xl bg-secondary border border-border">
          <div
            className="text-xl font-bold tracking-[-0.03em] text-blue-500"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {candidateTalkRatio}%
          </div>
          <div
            className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mt-1"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            You spoke
          </div>
        </div>
        <div className="text-center p-3 rounded-xl bg-secondary border border-border">
          <div
            className="text-xl font-bold tracking-[-0.03em] text-muted-foreground"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {aiRatio}%
          </div>
          <div
            className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mt-1"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            AI spoke
          </div>
        </div>
        <div className="text-center p-3 rounded-xl bg-secondary border border-border">
          <div
            className={cn(
              "text-xl font-bold tracking-[-0.03em]",
              balance.color,
            )}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {balance.label}
          </div>
          <div
            className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mt-1"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Balance
          </div>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="h-7 rounded-lg overflow-hidden flex border border-border mb-2">
        <div
          className="flex items-center justify-center text-[11px] font-medium text-white transition-all duration-1000"
          style={{
            width: `${candidateTalkRatio}%`,
            minWidth: "44px",
            background: "linear-gradient(90deg, #2563eb, rgba(37,99,235,0.7))",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          You · {candidateTalkRatio}%
        </div>
        <div
          className="flex-1 flex items-center justify-center text-[11px] text-muted-foreground bg-secondary"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          AI · {aiRatio}%
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mb-4">
        <span>You</span>
        <span>AI Interviewer</span>
      </div>

      {/* Contextual note */}
      <div className="p-3 rounded-lg bg-blue-600/15 border border-blue-600/25 text-[12.5px] text-muted-foreground">
        <strong className="text-blue-400">Ideal range: 55–70%</strong> —{" "}
        {balance.note}
      </div>
    </div>
  );
};
