"use client";

import React from "react";
import {
  X,
  CalendarDays,
  TrendingUp,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDisplayDate, toIso, useCalendarStore } from "@/features/calenderStore";

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

const diffColor: Record<string, string> = {
  easy: "text-green-500",
  medium: "text-yellow-500",
  hard: "text-red-500",
};

const diffBg: Record<string, string> = {
  easy: "bg-green-500/10",
  medium: "bg-yellow-500/10",
  hard: "bg-red-500/10",
};

function DiffBadge({ diff }: { diff: string }) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${diffColor[diff]} ${diffBg[diff]}`}
    >
      {diff}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

function StatCard({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2.5">
      <p className="mb-1 text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-xl font-medium leading-none ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function DiffBar({
  label,
  count,
  max,
  colorClass,
  labelClass,
}: {
  label: string;
  count: number;
  max: number;
  colorClass: string;
  labelClass: string;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className={`w-12 text-[11px] font-medium ${labelClass}`}>
        {label}
      </span>
      <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-4 text-right text-[11px] text-muted-foreground">
        {count}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg bg-muted/50 p-3">
            <Skeleton className="mb-2 h-3 w-16" />
            <Skeleton className="h-6 w-10" />
          </div>
        ))}
      </div>
      <div>
        <Skeleton className="mb-3 h-3 w-28" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-2 flex items-center gap-2">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-[5px] flex-1 rounded-full" />
            <Skeleton className="h-3 w-3" />
          </div>
        ))}
      </div>
      <div>
        <Skeleton className="mb-3 h-3 w-28" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="mb-2 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5"
          >
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single-date body
// ─────────────────────────────────────────────────────────────────────────────

function SingleDateBody() {
  const router = useRouter();
  const { dayStat } = useCalendarStore();

  if (!dayStat) return null;

  const {
    totalSolved,
    totalAttempted,
    codingTime,
    potdCompleted,
    difficulty,
    solvedProblems,
    revisionProblems,
  } = dayStat;
  const maxDiff = Math.max(
    difficulty.easy,
    difficulty.medium,
    difficulty.hard,
    1,
  );

  const hours = Math.floor(codingTime / 60);
  const mins = codingTime % 60;
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Solved"
          value={totalSolved}
          valueClass="text-green-500"
        />
        <StatCard label="Attempted" value={totalAttempted} />
        <StatCard label="Coding Time" value={timeStr} valueClass="text-base" />
        <StatCard
          label="POTD"
          value={
            potdCompleted ? (
              <span className="flex items-center gap-1 text-sm text-yellow-500 font-medium">
                <Star size={14} fill="currentColor" /> Solved
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )
          }
        />
      </div>

      {/* Difficulty breakdown */}
      <div>
        <SectionTitle>Difficulty Breakdown</SectionTitle>
        <div className="flex flex-col gap-2">
          <DiffBar
            label="Easy"
            count={difficulty.easy}
            max={maxDiff}
            colorClass="bg-green-500"
            labelClass="text-green-500"
          />
          <DiffBar
            label="Medium"
            count={difficulty.medium}
            max={maxDiff}
            colorClass="bg-yellow-500"
            labelClass="text-yellow-500"
          />
          <DiffBar
            label="Hard"
            count={difficulty.hard}
            max={maxDiff}
            colorClass="bg-red-500"
            labelClass="text-red-500"
          />
        </div>
      </div>

      {/* Solved problems */}
      {solvedProblems.length > 0 && (
        <div>
          <SectionTitle>Solved Problems</SectionTitle>
          <div className="flex flex-col gap-1.5">
            {solvedProblems.map((p) => (
              <button
                key={p.title}
                onClick={() =>
                  router.push(
                    `/problems/problem-detail?title=${encodeURIComponent(p.title)}&tab=description`,
                  )
                }
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <span className="text-xs text-foreground">{p.title}</span>
                <DiffBadge diff={p.difficulty} />
              </button>
            ))}
          </div>
        </div>
      )}

      {solvedProblems.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <CalendarDays size={24} strokeWidth={1.5} className="opacity-40" />
          <p className="text-xs">No problems solved on this day</p>
        </div>
      )}

      {/* Revision due */}
      {revisionProblems.length > 0 && (
        <div>
          <SectionTitle>Revision Due</SectionTitle>
          <div className="flex flex-col gap-1.5">
            {revisionProblems.map((p) => (
              <button
                key={p.title}
                onClick={() =>
                  router.push(
                    `/problems/problem-detail?title=${encodeURIComponent(p.title)}&tab=description`,
                  )
                }
                className="flex items-center justify-between rounded-lg bg-blue-500/5 px-3 py-2.5 text-left transition-colors hover:bg-blue-500/10"
              >
                <div>
                  <span className="text-xs text-foreground">{p.title}</span>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Due {p.dueDate}
                  </p>
                </div>
                <DiffBadge diff={p.difficulty} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Range body
// ─────────────────────────────────────────────────────────────────────────────

function RangeBody() {
  const router = useRouter();
  const { rangeStat } = useCalendarStore();

  if (!rangeStat) return null;

  const {
    totalSolved,
    totalAttempted,
    dailyAverage,
    mostActiveDay,
    difficulty,
    topicDistribution,
    solvedProblems,
  } = rangeStat;
  const maxDiff = Math.max(
    difficulty.easy,
    difficulty.medium,
    difficulty.hard,
    1,
  );

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Total Solved"
          value={totalSolved}
          valueClass="text-green-500"
        />
        <StatCard label="Attempted" value={totalAttempted} />
        <StatCard
          label="Daily Avg"
          value={dailyAverage.toFixed(1)}
          valueClass="text-yellow-500"
        />
        <StatCard
          label="Most Active"
          value={mostActiveDay ? formatDisplayDate(mostActiveDay) : "—"}
          valueClass="text-sm"
        />
      </div>

      {/* Difficulty breakdown */}
      <div>
        <SectionTitle>Difficulty Breakdown</SectionTitle>
        <div className="flex flex-col gap-2">
          <DiffBar
            label="Easy"
            count={difficulty.easy}
            max={maxDiff}
            colorClass="bg-green-500"
            labelClass="text-green-500"
          />
          <DiffBar
            label="Medium"
            count={difficulty.medium}
            max={maxDiff}
            colorClass="bg-yellow-500"
            labelClass="text-yellow-500"
          />
          <DiffBar
            label="Hard"
            count={difficulty.hard}
            max={maxDiff}
            colorClass="bg-red-500"
            labelClass="text-red-500"
          />
        </div>
      </div>

      {/* Topic distribution */}
      {topicDistribution.length > 0 && (
        <div>
          <SectionTitle>Topic Distribution</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {topicDistribution.map(({ topic, count }) => (
              <span
                key={topic}
                className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/60 px-2 py-1 text-[11px]"
              >
                <span className="text-foreground">{topic}</span>
                <span className="font-semibold text-indigo-400">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Solved problems list */}
      {solvedProblems.length > 0 && (
        <div>
          <SectionTitle>Problems Solved</SectionTitle>
          <div className="flex flex-col gap-1.5">
            {solvedProblems.map((p) => (
              <button
                key={`${p.title}-${p.date}`}
                onClick={() =>
                  router.push(
                    `/problems/problem-detail?title=${encodeURIComponent(p.title)}&tab=description`,
                  )
                }
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <div>
                  <span className="text-xs text-foreground">{p.title}</span>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {formatDisplayDate(p.date)}
                  </p>
                </div>
                <DiffBadge diff={p.difficulty} />
              </button>
            ))}
          </div>
        </div>
      )}

      {solvedProblems.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <TrendingUp size={24} strokeWidth={1.5} className="opacity-40" />
          <p className="text-xs">No problems solved in this range</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main AnalyticsPanel
// ─────────────────────────────────────────────────────────────────────────────

const AnalyticsPanel: React.FC = () => {
  const {
    calendarMode,
    selectedDate,
    selectedRange,
    isLoadingStats,
    closeAnalyticsPanel,
  } = useCalendarStore();

  // Build header title
  const title = React.useMemo(() => {
    if (calendarMode === "single" && selectedDate) {
      return formatDisplayDate(selectedDate);
    }
    if (calendarMode === "range" && selectedRange.from && selectedRange.to) {
      return `${formatDisplayDate(toIso(selectedRange.from))} → ${formatDisplayDate(toIso(selectedRange.to))}`;
    }
    return "";
  }, [calendarMode, selectedDate, selectedRange]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <button
          onClick={closeAnalyticsPanel}
          className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Close analytics panel"
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingStats ? (
          <AnalyticsSkeleton />
        ) : calendarMode === "single" ? (
          <SingleDateBody />
        ) : (
          <RangeBody />
        )}
      </div>
    </div>
  );
};

export default AnalyticsPanel;
