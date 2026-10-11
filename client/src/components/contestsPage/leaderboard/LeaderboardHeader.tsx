"use client";

import React from "react";
import { Search, Snowflake } from "lucide-react";

type LeaderboardHeaderProps = {
  title: string;
  total: number;
  isFrozen: boolean;
  search: string;
  onSearchChange: (value: string) => void;
};

export default function LeaderboardHeader({ title, total, isFrozen, search, onSearchChange }: LeaderboardHeaderProps) {
  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold">{title} — Standings</h1>
          <div className="text-sm text-muted-foreground mt-1">{total} participants</div>
        </div>
        <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 min-w-[220px]">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by handle…"
            className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
          />
        </div>
      </div>
      {isFrozen && (
        <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/10 border border-amber-500/25 rounded-lg px-4 py-2.5 mb-4">
          <Snowflake className="h-4 w-4" />
          Standings are frozen — final ranks reveal when the contest ends.
        </div>
      )}
    </div>
  );
}
