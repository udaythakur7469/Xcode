"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { ContestSummary } from "@/features/contestStore";

const TYPE_STYLES: Record<string, { icon: string; className: string }> = {
  DAILY: { icon: "D", className: "bg-emerald-500/10 text-emerald-500" },
  WEEKLY: { icon: "W", className: "bg-blue-500/10 text-blue-500" },
  BIWEEKLY: { icon: "B", className: "bg-purple-500/10 text-purple-500" },
  MONTHLY: { icon: "M", className: "bg-orange-500/10 text-orange-500" },
};

const STATUS_STYLES: Record<string, string> = {
  LIVE: "bg-destructive/15 text-destructive",
  SCHEDULED: "bg-amber-500/15 text-amber-500",
  ENDED: "bg-muted text-muted-foreground",
};

export default function ContestListItem({ contest }: { contest: ContestSummary }) {
  const router = useRouter();
  const typeStyle = TYPE_STYLES[contest.type];
  const start = new Date(contest.startTime);

  return (
    <div
      onClick={() => router.push(`/contests/${contest.slug}`)}
      className="flex items-center gap-4 bg-card border rounded-xl px-4 py-4 hover:border-foreground/20 hover:bg-muted/40 transition-all cursor-pointer"
    >
      <div className={`w-11 h-11 rounded-lg flex-shrink-0 flex items-center justify-center font-mono font-bold text-sm ${typeStyle.className}`}>
        {typeStyle.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{contest.title}</div>
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
          {contest.status === "LIVE" && (
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" /> Live now
            </span>
          )}
          {contest.status === "SCHEDULED" && <span>{start.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>}
          {contest.status === "ENDED" && <span>Ended</span>}
          <span>{contest.problemCount} problems</span>
        </div>
      </div>
      <div className="text-xs font-mono text-muted-foreground whitespace-nowrap">
        {contest.participantCount} {contest.status === "ENDED" ? "finished" : "registered"}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded ${STATUS_STYLES[contest.status]}`}>
        {contest.status === "LIVE" ? "Live" : contest.status === "SCHEDULED" ? "Scheduled" : "Ended"}
      </span>
    </div>
  );
}
