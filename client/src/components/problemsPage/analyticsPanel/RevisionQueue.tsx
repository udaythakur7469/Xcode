"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCalendarStore } from "@/features/calenderStore";
import RevisionInfoButton from "@/components/problemDetailPage/helperComponents/revisionGuide/RevisionInforButton";

const diffColor: Record<string, string> = {
  easy: "text-green-500",
  medium: "text-yellow-500",
  hard: "text-red-500",
};

const RevisionQueue: React.FC = () => {
  const router = useRouter();
  const { revisionQueue, isLoadingRevision, fetchRevisionQueue } =
    useCalendarStore();

  React.useEffect(() => {
    fetchRevisionQueue();
  }, [fetchRevisionQueue]);

  if (isLoadingRevision) {
    return (
      <div className="w-full rounded-xl border border-border bg-card">
        <div className="border-b border-border px-3.5 py-2.5">
          <Skeleton className="h-3 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-border px-3.5 py-2.5"
          >
            <div>
              <Skeleton className="mb-1.5 h-3 w-36" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="h-4 w-12 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (revisionQueue.length === 0) return null;

  const overdueCount = revisionQueue.filter((r) => r.isOverdue).length;

  return (
    // No overflow-hidden here — the parent column (overflow-y-auto) handles
    // scrolling. The card just grows naturally so all items are reachable.
    // `relative` so the info button below can be absolutely positioned to
    // superimpose the card's top-right corner.
    <div className="relative w-full rounded-xl border border-border bg-card">
      <RevisionInfoButton className="absolute -top-1.5 -right-0.5 z-10" />

      {/* Header — always visible */}
      <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
        <div className="flex items-center gap-1.5">
          <RotateCcw size={12} className="text-blue-400" strokeWidth={2.5} />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Smart Revision Queue
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {overdueCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
              <AlertCircle size={9} strokeWidth={2.5} />
              {overdueCount} overdue
            </span>
          )}
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
            {revisionQueue.length}
          </span>
        </div>
      </div>

      {/* Items — grow naturally, parent column scrolls */}
      {revisionQueue.map((item, idx) => (
        <button
          key={item.title}
          onClick={() =>
            router.push(
              `/problems/problem-detail?title=${encodeURIComponent(item.title)}&tab=description`,
            )
          }
          className={cn(
            "flex w-full items-center justify-between px-3.5 py-2.5 text-left transition-colors hover:bg-accent/40",
            idx < revisionQueue.length - 1 && "border-b border-border",
          )}
        >
          <div>
            <p className="text-[12px] font-normal text-foreground">
              {item.title}
            </p>
            <p
              className={cn(
                "mt-0.5 text-[10px]",
                item.isOverdue ? "text-red-400" : "text-muted-foreground",
              )}
            >
              {item.dueDate}
            </p>
          </div>
          <span
            className={`text-[11px] font-semibold ${diffColor[item.difficulty]}`}
          >
            {item.difficulty}
          </span>
        </button>
      ))}
    </div>
  );
};

export default RevisionQueue;
