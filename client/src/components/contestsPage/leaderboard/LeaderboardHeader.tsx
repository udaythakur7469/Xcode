"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import type { Contest } from "@/features/contestStore";

type LeaderboardHeaderProps = {
  contest: Contest | null;
  rowCount: number;
  frozen: boolean;
  query: string;
  onQueryChange: (query: string) => void;
};

export default function LeaderboardHeader({ contest, rowCount, frozen, query, onQueryChange }: LeaderboardHeaderProps) {
  return (
    <div className="card-modern hero-mesh p-6 mt-4 flex items-center justify-between flex-wrap gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold">{contest?.title ?? "Leaderboard"}</h1>
          {frozen ? (
            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              🔒 Frozen
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-soft text-brand">
              <span className="h-1.5 w-1.5 rounded-full live-dot-brand live-pulse" /> live
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {frozen
            ? "Standings are frozen for the final stretch — real final results reveal when the contest ends."
            : `${contest?._count.participants.toLocaleString() ?? 0} competing · showing ${rowCount.toLocaleString()}`}
        </div>
      </div>
      <Input placeholder="Find a user…" value={query} onChange={(e) => onQueryChange(e.target.value)} className="w-48" />
    </div>
  );
}
