"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import LeaderboardTableRow from "./LeaderboardTableRow";
import type { LeaderboardRow } from "@/features/contestStore";

type LeaderboardTableProps = {
  rows: LeaderboardRow[];
  hasMore: boolean;
  sentinelRef: React.RefObject<HTMLDivElement>;
};

export default function LeaderboardTable({ rows, hasMore, sentinelRef }: LeaderboardTableProps) {
  return (
    <div className="card-modern mt-6 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 border-b text-xs text-muted-foreground uppercase tracking-wide">
          <tr>
            <th className="text-left font-medium py-3 px-4">Rank</th>
            <th className="text-left font-medium py-3 px-4">User</th>
            <th className="text-center font-medium py-3 px-4">Solved</th>
            <th className="text-center font-medium py-3 px-4">Penalty</th>
            <th className="text-right font-medium py-3 px-4">Rating</th>
            <th className="text-right font-medium py-3 px-4">Δ Rating</th>
          </tr>
        </thead>
        <tbody className="max-h-[60vh] overflow-y-auto">
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <LeaderboardTableRow key={r.userId} row={r} />
            ))}
          </AnimatePresence>
        </tbody>
      </table>
      <div ref={sentinelRef} className="text-center text-xs text-muted-foreground py-4">
        {hasMore ? "Loading more…" : rows.length ? "You've reached the end" : "No users match your search"}
      </div>
    </div>
  );
}
