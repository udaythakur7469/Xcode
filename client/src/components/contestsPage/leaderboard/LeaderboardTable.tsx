"use client";

import React from "react";
import LeaderboardTableRow from "./LeaderboardTableRow";
import type { LeaderboardRow } from "@/features/contestStore";

type LeaderboardTableProps = {
  rows: LeaderboardRow[];
  problemLabels: string[];
  hasMore: boolean;
  onLoadMore: () => void;
};

export default function LeaderboardTable({ rows, problemLabels, hasMore, onLoadMore }: LeaderboardTableProps) {
  return (
    <div className="bg-card border rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 border-b text-xs text-muted-foreground uppercase tracking-wide">
          <tr>
            <th className="text-left font-medium py-3 px-4">Rank</th>
            <th className="text-left font-medium py-3 px-4">Competitor</th>
            {problemLabels.map((label) => (
              <th key={label} className="text-center font-medium py-3 px-2 w-10">
                {label}
              </th>
            ))}
            <th className="text-center font-medium py-3 px-4">Penalty</th>
            <th className="text-right font-medium py-3 px-4">Points</th>
            <th className="text-right font-medium py-3 px-4">Δ Rating</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <LeaderboardTableRow key={r.userId} row={r} problemLabels={problemLabels} />
          ))}
        </tbody>
      </table>
      <div className="text-center text-xs text-muted-foreground py-4">
        {hasMore ? (
          <button onClick={onLoadMore} className="hover:text-foreground underline">
            Load more
          </button>
        ) : rows.length ? (
          "You've reached the end"
        ) : (
          "No users match your search"
        )}
      </div>
    </div>
  );
}
