"use client";

import React from "react";
import type { RatingHistoryPoint } from "@/features/contestStore";

type ContestHistoryCardProps = {
  history: RatingHistoryPoint[];
};

export default function ContestHistoryCard({ history }: ContestHistoryCardProps) {
  return (
    <div className="card-modern p-5 overflow-hidden">
      <div className="text-sm font-semibold mb-3">Contest History</div>
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-foreground uppercase tracking-wide border-b">
          <tr>
            <th className="text-left font-medium py-2">Contest</th>
            <th className="text-right font-medium py-2">Rating</th>
            <th className="text-right font-medium py-2">Δ</th>
          </tr>
        </thead>
        <tbody>
          {history.map((hRow, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-2">{hRow.contestTitle}</td>
              <td className="text-right font-mono">{hRow.rating}</td>
              <td className={`text-right font-mono ${hRow.delta >= 0 ? "text-brand" : "text-red-500"}`}>
                {hRow.delta >= 0 ? `+${hRow.delta}` : hRow.delta}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
