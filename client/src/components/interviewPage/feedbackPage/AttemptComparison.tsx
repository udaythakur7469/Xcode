"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  FeedbackHistoryData,
} from "@/features/interviewStore";
import moment from "moment";

interface AttemptComparisonProps {
  historyData: FeedbackHistoryData;
  currentInterviewId: number;
  role: string;
}

const CATEGORY_ORDER = [
  "Communication Skills",
  "Technical Knowledge",
  "Problem Solving",
  "Cultural Fit",
  "Confidence and Clarity",
];

const VERDICT_LABELS: Record<string, string> = {
  NOT_RECOMMENDED: "Not Recommended",
  DO_NOT_HIRE: "Do Not Hire",
  PREFER_NOT_TO_HIRE: "Prefer Not To Hire",
  WORTH_CONSIDERING: "Worth Considering",
  RECOMMENDED: "Recommended",
  MUST_HIRE: "Must Hire",
};

function Delta({ prev, curr }: { prev: number; curr: number }) {
  const diff = curr - prev;
  if (diff > 0)
    return (
      <span
        className="text-[11px] text-emerald-500"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        ↑ +{diff}
      </span>
    );
  if (diff < 0)
    return (
      <span
        className="text-[11px] text-red-500"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        ↓ {diff}
      </span>
    );
  return (
    <span
      className="text-[11px] text-muted-foreground"
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      — same
    </span>
  );
}

// ─── Locked state (no previous attempt) ──────────────────────────────────────

function LockedState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      <div className="text-[32px] opacity-40">🔒</div>
      <div
        className="text-[15px] font-bold text-muted-foreground tracking-[-0.02em]"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        No previous attempt to compare
      </div>
      <p className="text-[13px] text-muted-foreground max-w-[280px] leading-relaxed">
        Complete a second interview for the same role and type to unlock
        side-by-side comparison and see how you&apos;ve improved.
      </p>
      <span
        className="text-[11px] px-4 py-1.5 rounded-full bg-blue-600/15 border border-blue-600/25 text-blue-400"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        Available after Attempt #2
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const AttemptComparison: React.FC<AttemptComparisonProps> = ({
  historyData,
  currentInterviewId,
  role,
}) => {
  const { history } = historyData;

  // Need at least 2 attempts to compare
  if (history.length < 2) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-blue-600/40 transition-colors">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-[30px] h-[30px] rounded-lg bg-blue-600/15 border border-blue-600/40 flex items-center justify-center text-sm">
            🔄
          </div>
          <h2
            className="text-lg font-bold tracking-[-0.02em] text-foreground"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Attempt Comparison
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>
        <LockedState />
      </div>
    );
  }

  // Current attempt = the one matching currentInterviewId
  const currentIndex = history.findIndex(
    (h) => h.interviewId === currentInterviewId
  );
  const current = history[currentIndex];
  const prev = history[currentIndex - 1] ?? history[history.length - 2];

  if (!current || !prev) return null;

  const currentNum = currentIndex + 1;
  const prevNum = currentIndex;

  const totalDiff = Math.round(current.totalScore - prev.totalScore);
  const improving = totalDiff > 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-blue-600/40 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-[30px] h-[30px] rounded-lg bg-blue-600/15 border border-blue-600/40 flex items-center justify-center text-sm">
          🔄
        </div>
        <h2
          className="text-lg font-bold tracking-[-0.02em] text-foreground"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Attempt Comparison
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-[13px] text-muted-foreground">
          Comparing your last 2 attempts for{" "}
          <strong className="text-foreground">{role}</strong>
        </p>
        <div className="flex gap-2">
          <span
            className="text-[11px] px-2 py-1 rounded-lg bg-blue-600/10 border border-blue-600/20 text-blue-400"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Attempt #{currentNum} (current)
          </span>
          <span
            className="text-[11px] px-2 py-1 rounded-lg bg-border text-muted-foreground border border-border"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Attempt #{prevNum} · {moment(prev.createdAt).format("MMM D")}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr>
              {[
                "Category",
                `Attempt #${prevNum}`,
                `Attempt #${currentNum}`,
                "Δ Change",
              ].map((h) => (
                <th
                  key={h}
                  className={cn(
                    "pb-2 border-b border-border text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-medium",
                    h === "Category" ? "text-left" : "text-center",
                  )}
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Overall */}
            <tr>
              <td
                className="py-2.5 border-b border-border font-semibold text-foreground"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Overall Score
              </td>
              <td
                className="py-2.5 border-b border-border text-center text-muted-foreground"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {Math.round(prev.totalScore)}
              </td>
              <td
                className="py-2.5 border-b border-border text-center text-blue-400 font-semibold"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {Math.round(current.totalScore)}
              </td>
              <td className="py-2.5 border-b border-border text-center">
                <Delta
                  prev={Math.round(prev.totalScore)}
                  curr={Math.round(current.totalScore)}
                />
              </td>
            </tr>

            {/* Category scores */}
            {CATEGORY_ORDER.map((catName) => {
              const prevCat = prev.categoryScores.find(
                (c) => c.name === catName,
              );
              const currCat = current.categoryScores.find(
                (c) => c.name === catName,
              );
              if (!prevCat || !currCat) return null;
              return (
                <tr key={catName}>
                  <td
                    className="py-2.5 border-b border-border font-semibold text-foreground"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {catName}
                  </td>
                  <td
                    className="py-2.5 border-b border-border text-center text-muted-foreground"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {Math.round(prevCat.score)}
                  </td>
                  <td
                    className="py-2.5 border-b border-border text-center text-blue-400 font-semibold"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {Math.round(currCat.score)}
                  </td>
                  <td className="py-2.5 border-b border-border text-center">
                    <Delta
                      prev={Math.round(prevCat.score)}
                      curr={Math.round(currCat.score)}
                    />
                  </td>
                </tr>
              );
            })}

            {/* Verdict */}
            <tr>
              <td
                className="py-2.5 font-semibold text-foreground"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Verdict
              </td>
              <td
                className="py-2.5 text-center text-muted-foreground text-[12px]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {VERDICT_LABELS[prev.finalVerdict] ?? prev.finalVerdict}
              </td>
              <td
                className="py-2.5 text-center text-blue-400 font-semibold text-[12px]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {VERDICT_LABELS[current.finalVerdict] ?? current.finalVerdict}
              </td>
              <td className="py-2.5 text-center">
                <span
                  className={cn(
                    "text-[11px]",
                    improving ? "text-emerald-500" : "text-red-500",
                  )}
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {improving ? "↑ Improved" : "↓ Declined"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary strip */}
      <div
        className={cn(
          "mt-4 p-3 rounded-lg text-[13px] text-muted-foreground border",
          improving
            ? "bg-emerald-500/10 border-emerald-500/15"
            : "bg-amber-500/10 border-amber-500/15",
        )}
      >
        {improving ? "📈" : "📉"}{" "}
        <strong className={improving ? "text-emerald-500" : "text-amber-500"}>
          {improving ? "Improving trajectory" : "Score dipped this attempt"}
        </strong>{" "}
        — Overall score{" "}
        {improving
          ? `up ${totalDiff} points`
          : `down ${Math.abs(totalDiff)} points`}
        .{" "}
        {improving
          ? "Keep focusing on your lowest-scoring categories for your next attempt."
          : "Review the recommended topics below and retake when ready."}
      </div>
    </div>
  );
};